<?php
/** 
 * Create the GPX Viewer options page.
 * 
 * @package GpxViewer
 */
?>
<div>
	<form action="options.php" method="post">
		<?php settings_fields( 'gpx_viewer_options' ); ?>
		<?php do_settings_sections( 'gpx-viewer-settings' ); ?>
		<input name="submit" type="submit" value="<?php esc_attr_e('Save Changes'); ?>" />
	</form>
	<h3>A Quick How-To</h3>
	<ol>
		<li>
			<strong>Attach a GPX file to a post.</strong> In the post editor, click the Add
			Media button at the top of the editor (looks like a Sun in WP 2.9.1) and upload the
			GPX file. Just close the dialog once it's uploaded.
		</li>
		<li>
			<strong>Add a GPX viewer link to the post.</strong> Just type the shortcode 
			<code>[gpx_viewer_link]</code> where you want the link to appear.
		</li>
	</ol>
		
	<p>
		If you want a link on every post that has a GPX attachment without typing the shortcode
		every time, you can add a tag to your post template: 
		<code>&lt;?php echo GpxViewer::link(); ?&gt;</code>.
	<p>
</div>
