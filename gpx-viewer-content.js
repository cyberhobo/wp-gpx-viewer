/**
 * Activate nyroModal for GPX Viewer links.
 * @package GpxViewer
 */
if ( jQuery ) {
	jQuery( function( $ ) {
		$('.gpx-viewer-link').nyroModal( { width: 1060, height: 550 } );
	} );
}
