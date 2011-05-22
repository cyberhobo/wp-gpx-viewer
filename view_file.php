<?php
/**
 * Render a GPX Viewer for a requested URL in a complete XHTML document.
 *
 * @package GPXViewer
 */

function gpx_viewer_view_file( $script_path ) {
	global $geo_mashup_options;
	if ( $geo_mashup_options ) {
		$google_key = $geo_mashup_options->get( 'overall', 'google_key' );
	} else {
		$google_key = get_option( 'google_key' );
	}
	if ( defined( 'WP_DEBUG' ) and WP_DEBUG ) {
		$gpx2gm_file = 'GPX2GM.js';
	} else {
		$gpx2gm_file = 'GPX2GM.min.js';
	}
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
  <head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
    <meta http-equiv="Content-Style-Type" content="text/css" />
    <title>GPX Viewer</title>
		<script src="<?php echo trailingslashit( $script_path ) . $gpx2gm_file; ?>" type="text/javascript"></script>
  </head>
  <body>
		<script>
			GPX2GM.addViewer( '<?php echo $google_key; ?>', '<?php echo $_GET['url']; ?>' );
		</script>
	</body>
</html>
<?php
}
?>
