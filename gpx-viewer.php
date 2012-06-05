<?php /*
Plugin Name: GPX Viewer
Plugin URI: http://www.cyberhobo.net/2010/02/wordpress-gpx-viewer-plugin
Description: View uploaded GPX files on a Google map with interactive elevation profile, grade, and speed graphs using <a href="http://www.j-berkemeier.de/GPXViewer/">J�rgen Berkemeir's GPX Viewer scripts</a>. For non-commercial use only.
Version: 0.5
Author: Dylan Kuhn
Author URI: http://www.cyberhobo.net/
Minimum WordPress Version Required: 2.9
*/

/*
Copyright (c) 2005-2010 Dylan Kuhn

This program is free software; you can redistribute it
and/or modify it under the terms of the GNU General Public
License as published by the Free Software Foundation;
either version 2 of the License.

This program is distributed in the hope that it will be
useful, but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
PURPOSE. See the GNU General Public License for more
details.
*/

if ( !class_exists( 'GpxViewer' ) ) {

/**
 * The GPX Viewer singleton class
 */
class GpxViewer {
	var $dir_path;
	var $url_path;
	var $basename;
	var $attachment_file;
	var $gpx_urls = array();

	/**
	 * Static method to get the singleton instance.
	 * @static
	 */
	function get_instance() {
		static $instance = null;

		if ( is_null( $instance ) ) {
			$instance = new GpxViewer();
		}
		return $instance;
	}

	/**
	 * PHP4 Constructor
	 */
	function GpxViewer() {

		// Initialize members
		$this->dir_path = dirname( __FILE__ );
		$this->basename = plugin_basename( __FILE__ );
		$dir_name = substr( $this->basename, 0, strpos( $this->basename, '/' ) );
		$this->url_path = trailingslashit( WP_PLUGIN_URL ) . $dir_name;
		load_plugin_textdomain( 'GpxViewer', 'wp-content/plugins/'.$dir_name, $dir_name );

		// Set up hooks
		add_action( 'init', array( &$this, 'init' ) );

		if ( is_admin() ) {
			add_action( 'admin_init', array( &$this, 'admin_init' ) );
			register_activation_hook( $this->basename, array( &$this, 'activation_hook' ) ) ;
			add_action( 'admin_notices', array( &$this, 'admin_notices' ) );
			add_action( 'admin_menu', array( &$this, 'admin_menu' ) );
		}
	}

	function init() {

		// Uploadable GPX content type expansion always enabled
		add_filter( 'upload_mimes', array( &$this, 'upload_mimes' ) );

		if ( ! is_admin() ) {
			add_shortcode( 'gpx_viewer_link', array( 'GpxViewer', 'link' ) );
			add_shortcode( 'gpx_viewer_link_list', array( 'GpxViewer', 'link_list' ) );
			add_filter( 'query_vars', array( &$this, 'query_vars' ) );
			add_action( 'template_redirect', array( &$this, 'template_redirect' ) );
			wp_enqueue_script( 'jquery' );
			$nyro_modal_src = trailingslashit( $this->url_path ) . 'jquery.nyroModal/js/jquery.nyroModal.custom.min.js';
			wp_enqueue_script( 'nyro-modal', $nyro_modal_src, 'jquery', '2.0' );
			$nyro_modal_css = trailingslashit( $this->url_path ) . 'jquery.nyroModal/styles/nyroModal.css';
			wp_enqueue_style( 'nyro-modal', $nyro_modal_css, array(), '2.0', 'screen' );
			wp_enqueue_script( 'gpx-viewer-loader', trailingslashit( $this->url_path ) . 'gpx-viewer-content.js', 'jquery' );
		}
	}

	function admin_init() {
		// To add plugin listing links
		add_filter( 'plugin_action_links', array( &$this, 'plugin_action_links' ), 10, 2 );

		register_setting( 'gpx_viewer_options', 'gpx_viewer_options', array( &$this, 'validate_options' ) );
		add_settings_section(
			$id = 'gpx_viewer_main', 
			$title = __( 'GPX Viewer Settings', 'GpxViewer' ),
			$callback = create_function( '', '' ),
			$page = 'gpx-viewer-settings'
		);
		add_settings_field(
			$id = 'gpx_viewer_google_key', 
			$title = __( 'Google API Key', 'GpxViewer' ), 
			$callback = array( &$this, 'setting_html' ), 
			$page = 'gpx-viewer-settings', 
			$section = 'gpx_viewer_main',
			$args = 'google_key'
		);
		add_settings_field(
			$id = 'gpx_viewer_link_text', 
			$title = __( 'Default Link Text', 'GpxViewer' ), 
			$callback = array( &$this, 'setting_html' ), 
			$page = 'gpx-viewer-settings', 
			$section = 'gpx_viewer_main',
			$args = 'link_text'
		);
	}

	/** 
	 * Do first run tasks on activation.
	 */
	function activation_hook() {
		$default_options = array( 
			'google_key' => get_option( 'google_api_key' ),
			'link_text' => __( 'GPX Viewer Track Map and Graphs', 'GpxViewer' )
		);
		$options = get_option( 'gpx_viewer_options' );
		foreach( $default_options as $option => $default_value ) {
			if ( empty( $options[$option] ) ) {
				$options[$option] = $default_value;
			}
		}
		update_option( 'gpx_viewer_options', $options );
	}

	/**
	 * Display important messages to an admin.
	 * 
	 * admin_notices {@link http://codex.wordpress.org/Plugin_API/Action_Reference#Advanced_Actions action}
	 * called by WordPress.
	 *
	 */
	function admin_notices() {
		$message = '';
		$options = get_option( 'gpx_viewer_options' );
		if ( empty( $options['google_key'] ) and current_user_can( 'manage_options' ) ) {
			if ( ! isset( $_GET['page'] ) or 'gpx-viewer-settings' != $_GET['page'] ) {
				// We're not looking at the settings, but it's important to do so
				$message = __( 'GPX Viewer requires a Google API key in the <a href="%s">settings</a> before it will work.', 'GpxViewer' );
				$message = sprintf( $message, admin_url( 'options-general.php?page=gpx-viewer-settings' ) );
			}
		}

		if ( ! empty( $message ) ) {
			echo '<div class="error fade"><p>' . $message . '</p></div>';
		}
	}
	
	/**
	 * Add an admin menu page.
	 */
	function admin_menu() {
		add_options_page( 
			$page_title = __( 'GPX Viewer Settings', 'GpxViewer' ), 
			$menu_title = __( 'GPX Viewer', 'GpxViewer' ),
			$access_level = 'manage_options', 
			$page_slug = 'gpx-viewer-settings',
			$function = array( &$this, 'options_page' )
		);
	}

	/**
	 * Add custom action links to the plugin listing.
	 * 
	 * plugin_action_links {@link http://codex.wordpress.org/Plugin_API/Filter_Reference#Advanced_WordPress_Filters filter},
	 * called by WordPress.
	 */
	function plugin_action_links( $links, $file ) {
		if ( $this->basename == $file ) {
			$settings_link = '<a href="' . admin_url( 'options-general.php?page=gpx-viewer-settings' ) .'">' .
				__( 'Settings' ) . '</a>';
			array_unshift( $links, $settings_link );
		}
		return $links;
	}

	/**
	 * Output the options page.
	 */
	function options_page() {
		include( 'options_page.php' );
	}

	/**
	 * Add GPX mime type to allowable uploads.
	 */
	function upload_mimes( $mimes ) {
		$mimes['gpx'] = 'application/octet-stream';
		return $mimes;
	}

	/**
	 * Output HTML for a setting field.
	 */
	function setting_html( $field ) {
		$options = get_option( 'gpx_viewer_options' );
		switch( $field ) {

		case 'google_key':
			echo '<input id="gpx_viewer_google_key" name="gpx_viewer_options[google_key]" size="65" type="text" value="' .
				$options['google_key'] . '" />';
			if ( empty( $options['google_key'] ) ) {
				echo '<span class="error setting-description">Required - <a href="http://maps.google.com/apis/maps/signup.html">' .
					__('Get yours here', 'GpxViewer') . '</a></span>';
			}
			break;

		case 'link_text':
			echo '<input id="gpx_viewer_link_text" name="gpx_viewer_options[link_text]" size="65" type="text" value="' .
				$options['link_text'] . '" />';
			break;
		}
	}

	/**
	 * Validate options before saving.
	 */
	function validate_options( $input ) {
		$options = array();
		$options['google_key'] = trim( $input['google_key'] );
		if ( empty( $options['google_key'] ) or ! preg_match( '/^[-_a-zA-Z0-9]*$/', $options['google_key'] ) ) {
			$options['google_key'] = get_option( 'google_api_key' );
		}
		$options['link_text'] = esc_html( trim( $input['link_text'] ) );
		return $options;
	}

	/**
	 * Add GPX viewer query variables.
	 *
	 * @see query_vars filter
	 */
	function query_vars( $public_query_vars ) {
		$public_query_vars[] = 'gpx_viewer_content';
		return $public_query_vars;
	}

	/**
	 * Deliver specialized content.
	 */
	function template_redirect() {
		$gpx_viewer_content = get_query_var( 'gpx_viewer_content' );
		if ( ! empty( $gpx_viewer_content ) ) {

			// The parameter's purpose is to get us here, we can remove it now
			unset( $_GET['gpx_viewer_content'] );

			// TODO: Some kind of client verification should probably go here, check_ajax_referer or similar

			// Call the function corresponding to the content request
			// This provides some security, as only implemented methods will be executed
			// Change dashes to underscores for function names
			// Currently just one implementd: view-file
			$method = str_replace( '-', '_', $gpx_viewer_content );
			call_user_func( array( &$this, $method ) );
			exit();
		}
	}

	/**
	 * Echo markup for a GPX file viewer.
	 */
	function view_file() {
		include_once( 'view_file.php' );
		gpx_viewer_view_file( trailingslashit( $this->url_path ) );
	}

	/**
	 * Get the URLs of GPX files attached to the current post.
	 * @static
	 * @return strings The URL, empty if none.
	 */
	function get_gpx_attachments() {
		$gpx_urls = array();
		$post_id = get_the_ID();
		if ( $post_id ) {
			$attachments = get_posts( array( 
				'post_type' => 'attachment',
				'numberposts' => -1,
				'post_status' => null,
				'post_parent' => $post_id
			) );
			if ( $attachments ) {
				foreach( $attachments as $attachment ) {
					$attachment_url = $attachment->guid;
					$dot_pos = stripos( $attachment_url, '.gpx');
					if ( $dot_pos == strlen( $attachment_url ) - 4) {
						$gpx_urls[] = $attachment_url;
					}
				}
			}
		}
		return $gpx_urls;
	}

	/**
	 * Get the URL of the first GPX file attached to the current post.
	 * @static
	 * @return string The URL, empty if none.
	 */
	function get_gpx_attachment() {
		$urls = GpxViewer::get_gpx_attachments();
		if ( ! empty( $urls ) ) {
			return $urls[0];
		} else {
			return '';
		}
	}

	/**
	 * Get viewer URLs for the current post if it has a GPX attachments.
	 *
	 * @static
	 * @return array Viewer URLs.
	 */
	function urls() {
		$urls = array();
		$gpx_urls = GpxViewer::get_gpx_attachments();
		if ( $gpx_urls ) {
			foreach( $gpx_urls as $gpx_url ) {
				$urls[] = trailingslashit( get_bloginfo( 'url' ) ) . '?gpx_viewer_content=view-file&amp;url=' .
					urlencode( $gpx_url );
			}
		}
		return $urls;
	}

	/**
	 * Get a viewer URL for the current post if it has a GPX attachment.
	 *
	 * Use with echo as a template tag. Static for easier syntax:
	 *
	 * <code> echo GpxViewer::url(); </code>
	 *
	 * @static
	 * @return string Viewer URL or empty string.
	 */
	function url() {
		$url = '';
		$gpx_url = GpxViewer::get_gpx_attachment();
		if ( $gpx_url ) {
			$url = trailingslashit( get_bloginfo( 'url' ) ) . '?gpx_viewer_content=view-file&amp;url=' .
				urlencode( $gpx_url );
		}
		return $url;
	}

	/**
	 * Get HTML for a list of GPX Viewer links for the current post.
	 *
	 * Use with echo as a template tag. Static for easier syntax:
	 *
	 * <code> echo GpxViewer::links(); </code>
	 *
	 * @static
	 * @return string Viewer link list HTML.
	 */
	function link_list( $args = '' ) {
		$options = get_option( 'gpx_viewer_options' );
		$default_args = array(
			'link_text' => $options['link_text'],
			'list_class' => 'gpx-viewer-link-list'
		);
		$args = wp_parse_args( $args, $default_args );
		$list = '';
		$viewer_urls = GpxViewer::urls();
		if ( ! empty( $viewer_urls ) ) {
			$list .= '<ul class="' . $args['list_class'] . '">';
			foreach( $viewer_urls as $viewer_url ) {
				$list .= '<li><a href="' . $viewer_url . '" class="gpx-viewer-link" target="_blank">' .
					$args['link_text'] . ' (' . basename( urldecode( $viewer_url ), '.gpx' ) . ')</a></li>';
			}
			$list .= '</ul>';
		}
		return $list;
	}

	/**
	 * Get HTML for a GPX Viewer link for the current post.
	 *
	 * Use with echo as a template tag. Static for easier syntax:
	 *
	 * <code> echo GpxViewer::link( 'link_text=Super Awesome GPX Viewer' ); </code>
	 *
	 * @static
	 * @return string Viewer link HTML.
	 */
	function link( $args = '' ) {
		$options = get_option( 'gpx_viewer_options' );
		$default_args = array(
			'link_text' => $options['link_text']
		);
		$args = wp_parse_args( $args, $default_args );
		$link = '';
		$viewer_url = GpxViewer::url();
		if ( $viewer_url ) {
			$link .= '<a href="' . $viewer_url . '" class="gpx-viewer-link" target="_blank">' .
				$args['link_text'] . '</a>';
		}
		return $link;
	}

} // end GPX Viewer class

// Instantiate
GpxViewer::get_instance();

} // end if GPX Viewer class exists


