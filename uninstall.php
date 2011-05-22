<?php
/** 
 * Gpx Viewer uninstall procedure.
 *
 * @package GpxViewer
 */

// Make sure this is a legitimate uninstall request
if( ! defined( 'ABSPATH') or ! defined('WP_UNINSTALL_PLUGIN') or ! current_user_can( 'delete_plugins' ) )
	exit();

delete_option( 'gpx_viewer_options' );

?>
