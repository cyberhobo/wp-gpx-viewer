// GPX2GM;
// Darstellung von GPS-Daten aus einer GPX-Datei in Google Maps
// Version 4.2
// 13. 12. 2009 Jürgen Berkemeier
// www.j-berkemeier.de

/**
 * Repackaging by Dylan Kuhn 2010.01.28
 * 
 * Encapsulates in the GPX2GM object as namespace
 * Simple US translations of strings and units
 * Behaviors to simplify embedding in any HTML page
 */
var GPX2GM = GPX2GM || (function() {

	var language = normaliseLang(navigator.language /* Mozilla */ || navigator.userLanguage /* IE */),
		viewer_index = 0,
		units = ( language == 'en-US' ? 'us' : 'si' ),
		dictionary = {
		'en': {
			'Strecke': 'Distance',
			'Strecke in ': 'Distance in ',
			'H<br />ö<br />h<br />e<br />&nbsp;<br />in<br />&nbsp;<br />': 'E<br />l<br />v<br />.<br />&nbsp;<br />in<br />&nbsp;<br />',
			'Stg.<br />&nbsp;<br />in<br />&nbsp;<br />%': 'Grd.<br />&nbsp;<br />in<br />&nbsp;<br />%',
			'V<br />&nbsp;<br />in<br />&nbsp;<br />': 'Spd.<br />&nbsp;<br />in<br />&nbsp;<br />',
			'Wegpunkt': 'Waypoint',
			'Wegpunkte': 'Waypoints',
			'Track': 'Track',
			'Tracks': 'Tracks',
			'Route': 'Route',
			'Routen': 'Routes',
			'Höhe': 'Elev.',
			'Geschw.': 'Speed',
			'Stg.': 'Grade',
			'Fehler': 'Error',
			'Beim Oeffnen der Datei ': 'Could not open the GPX file ',
			' ist der Fehler ': ' because the error ',
			' aufgetreten!': ' was received!',
			'Ihr Browser unterstützt nicht die benötigten Methoden!': 'Your browser doesn\'t support the methods needed by Google maps.'
			}
		},
		unit_conversions = {
			'us': {
				'm': { factor: 3.2808, label: 'ft' },
				'km': { factor: 0.62137, label: 'mi' },
				'km/h': { factor: 0.62137, label: 'mi/h' }
			}
		};

	/* Ensure language code is in the format aa-AA. */
	function normaliseLang(lang) {
		lang = lang.replace(/_/, '-').toLowerCase();
		if (lang.length > 3) {
			lang = lang.substring(0, 3) + lang.substring(3).toUpperCase();
		}
		return lang;
	}

	function _( text ) {
		var lang = language.slice( 0, 2 ),
			translation = text;
		if ( typeof dictionary[lang] === 'object' && typeof dictionary[lang][text] === 'string' ) {
			translation = dictionary[lang][text];
		}
		return translation;
	}

	function _u( unit, quantity, decimal_places, append_label ) {
		var output, conversion = false;
		if ( typeof unit_conversions[units] === 'object' && typeof unit_conversions[units][unit] === 'object' ) {
			conversion = unit_conversions[units][unit];
		}
		if ( typeof quantity !== 'number' ) {
			// Just a label is desired
			if ( conversion ) {
				return conversion.label;
			} else {
				return unit;
			}
		}
		output = quantity; 
		// Convert if needed
		if ( conversion ) {
			output *= conversion.factor;
		} 

		if (typeof decimal_places === 'number' ) {
			output = parseFloat(output.toFixed(decimal_places));
		}

		if ( typeof append_label !== 'boolean' ) {
			append_label = true;
		}
		if ( append_label ) {
			if ( conversion ) {
				output = output + conversion.label;
			} else {
				output = output + unit;
			}
		}
		return output;
	}

	if(typeof(GPXVIEW_Debuginfo)=="undefined") var GPXVIEW_Debuginfo = false;

	function makeMap(ID) {
		var lmCntrl = (typeof(LargeMapControll)!="undefined") ? LargeMapControll : false;
		var oMCntrl = (typeof(OverviewMapControl)!="undefined") ? OverviewMapControl : false;
		var legende = (typeof(Legende)!="undefined") ? Legende : true;
		var legende_trk = (typeof(Legende_trk)!="undefined") ? Legende_trk : true;
		var legende_rte = (typeof(Legende_rte)!="undefined") ? Legende_rte : true;
		var legende_wpt = (typeof(Legende_wpt)!="undefined") ? Legende_wpt : true;
		var t_verbinden = (typeof(Tracks_verbinden)!="undefined") ? Tracks_verbinden : false; 
		var rdSpeed = (typeof(readSpeed)!="undefined") ? readSpeed : true;
		var tOver = (typeof(TrackOver)!="undefined") ? TrackOver : true;
		var trcmt = (typeof(shTRcmt)!="undefined") ? shTRcmt : false;
		var udspcol = (typeof(DisplayColor)!="undefined") ? DisplayColor : false;
		var twidth = 2.0;
		var rwidth = 2.0;
		var widtho = 3.0;
		var topac = 0.8;
		var ropac = 0.8;
		var TrackCols = new Array("#ff0000","#00ff00","#0000ff","#aaaa00","#ff00ff","#00ffff","#000000");
		var rcols = new Array("#800000","#008000","#000080","#808000","#800080","#008080","#808080");
		var colo = "#000000";

		var icons = {
			scenic: { image:"scenic.png",iconSize:[21.0,31.0],
								shadow:"shadow.png",shadowSize:[52.0,29.0],
								iconAnchor:[5.0,30.0],infoWindowAnchor:[10.0,5.0] },
			marker: { image:"marker.gif",iconSize:[11.0,11.0],iconAnchor:[5.0,5.0] }
		}

		var makeIcon = function(SymName) {
			var icon = new GIcon();
			 if(icons[SymName]) {
				if(icons[SymName].image) icon.image = GPX2GM_Path + icons[SymName].image;
				if(icons[SymName].iconSize) icon.iconSize = new GSize(icons[SymName].iconSize[0],icons[SymName].iconSize[1]);
				if(icons[SymName].shadow) icon.shadow = GPX2GM_Path + icons[SymName].shadow;
				if(icons[SymName].shadowSize) icon.shadowSize = new GSize(icons[SymName].shadowSize[0],icons[SymName].shadowSize[1]);
				if(icons[SymName].iconAnchor) icon.iconAnchor = new GPoint(icons[SymName].iconAnchor[0],icons[SymName].iconAnchor[1]);
				if(icons[SymName].infoWindowAnchor) 
					icon.infoWindowAnchor = new GPoint(icons[SymName].infoWindowAnchor[0],icons[SymName].infoWindowAnchor[1]);
			}  
			return icon;
		} // makeIcon

		JB_GM_Info(ID,"makeMap",false);
		 var polylineEncoder = new PolylineEncoder(); 
		var dieses = this;
		var id = ID;
		var id_hp = ID+"_hp";
		var id_sp = ID+"_sp";
		var id_vp = ID+"_vp";
		var load = false
		var latmin=1000,latmax=-1000,lonmin=1000,lonmax=-1000;
		var zoom = 1;
		var osm_mapnik_map,osm_tah_map,osm_cycle_map;
		var fname,maptype;
		var tracks,waypoints,routes,tracklens,routlens,alledaten;
		var routeNames,trackNames,routeCMTs,trackCMTs;
		var tcols = new Array();
		var GPX2GM_Path="";
		var scr = document.getElementsByTagName("script");
		var hp_xtext = _('Strecke in ') + _u( 'km' );
		var vp_xtext = _('Strecke in ') + _u( 'km' );
		var sp_xtext = _('Strecke in ') + _u( 'km' );
		var hp_ytext = _("H<br />ö<br />h<br />e<br />&nbsp;<br />in<br />&nbsp;<br />") + _u('m');
		var sp_ytext = _("Stg.<br />&nbsp;<br />in<br />&nbsp;<br />%");
		var vp_ytext = _("V<br />&nbsp;<br />in<br />&nbsp;<br />") + _u('km/h');
		for(var i=0;i<scr.length;i++) if(scr[i].src && scr[i].src.length) {
			var path = scr[i].src;
			var pos = path.search(/GPX2GM(\.min)?.js/);
			if(pos!=-1) {
				GPX2GM_Path = path.substring(0,pos);
				break;
			}
		}  
		var scenicicon = makeIcon("scenic") ;
		var markericon = makeIcon("marker") ;
		var movemarker;
		var markerinfo = document.createElement("div");
		markerinfo.style.position = "absolute";
		markerinfo.style.visibility = "hidden";
		markerinfo.style.border = "1px solid black";
		markerinfo.style.backgroundColor = "white";
		var div = document.getElementById(id);
		var w = div.offsetWidth;
		var h = div.offsetHeight;
		var MapHead = document.createElement("div");
		MapHead.id = "map_head"+id;
		MapHead.style.margin = 0;
		MapHead.style.padding = 0;
	//  MapHead.style.fontSize = "0.8em";
	//  MapHead.style.lineHeight = "1.5em";
		MapHead.appendChild(document.createTextNode(": "));
		var mapdiv = document.createElement("div");
		mapdiv.id = "map_"+id;
		mapdiv.style.width = w+"px";
		while(div.hasChildNodes()) div.removeChild(div.firstChild);
		if(!legende) MapHead.style.display="none";
		div.appendChild(MapHead);
		div.appendChild(mapdiv);
		if (legende) mapdiv.style.height = h-mapdiv.offsetTop+MapHead.offsetTop+"px";
		else         mapdiv.style.height = h+"px";
		var map = new GMap2(document.getElementById("map_"+id));
		if(lmCntrl) map.addControl(new GLargeMapControl());
		else                 map.addControl(new GSmallMapControl());
		if(oMCntrl) map.addControl(new GOverviewMapControl());
		map.addMapType(G_PHYSICAL_MAP);
		var copyrightCollection = new GCopyrightCollection('&copy; 2009 <a href="http://www.openstreetmap.org/">OpenStreetMap</a>');
		copyrightCollection.addCopyright(new GCopyright(1,new GLatLngBounds(new GLatLng(-90,-180),new GLatLng(90,180)),0,'(<a rel="license" href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>)'));
		var tilelayers_mapnik = new Array();
		tilelayers_mapnik[0] = new GTileLayer(copyrightCollection, 0, 18);
		tilelayers_mapnik[0].getTileUrl = function(a, z) { return "http://tile.openstreetmap.org/" + z + "/" + a.x + "/" + a.y + ".png"; };
		tilelayers_mapnik[0].isPng = function() { return true; };
		tilelayers_mapnik[0].getOpacity = function() { return 1.0; };
		osm_mapnik_map = new GMapType(tilelayers_mapnik,new GMercatorProjection(19), "OSM Mapnik",{ urlArg: 'mapnik', linkColor: '#000000' });
		map.addMapType(osm_mapnik_map);
		var tilelayers_tah = new Array();
		tilelayers_tah[0] = new GTileLayer(copyrightCollection, 0, 17);
		tilelayers_tah[0].getTileUrl = function(a, z) { return "http://tah.openstreetmap.org/Tiles/tile/" + z + "/" + a.x + "/" + a.y + ".png"; };
		tilelayers_tah[0].isPng = function() { return true; };
		tilelayers_tah[0].getOpacity = function() { return 1.0; };
		osm_tah_map = new GMapType(tilelayers_tah,new GMercatorProjection(19), "OSM T&H",{ urlArg: 'tah', linkColor: '#000000' });
		map.addMapType(osm_tah_map);
		copyrightCollection = new GCopyrightCollection('&copy; 2009 <a href="http://www.opencyclemap.org/">OpenCycleMap</a> <a href="http://www.openstreetmap.org/">OpenStreetMap</a>');
		copyrightCollection.addCopyright(new GCopyright(1,new GLatLngBounds(new GLatLng(-90,-180),new GLatLng(90,180)),0,'(<a rel="license" href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>)'));
		var tilelayers_cycle = new Array();
		tilelayers_cycle[0] = new GTileLayer(copyrightCollection, 0, 17);
		tilelayers_cycle[0].getTileUrl = function(a, z) { return "http://andy.sandbox.cloudmade.com/tiles/cycle/" + z + "/" + a.x + "/" + a.y + ".png"; };
		tilelayers_cycle[0].isPng = function() { return true; };
		tilelayers_cycle[0].getOpacity = function() { return 1.0; };
		osm_cycle_map = new GMapType(tilelayers_cycle,new GMercatorProjection(19), "OSM Cycle",{ urlArg: 'cycle', linkColor: '#000000' });
		map.addMapType(osm_cycle_map);
		map.addControl(new GMenuMapTypeControl());
	//  map.addControl(new GMapTypeControl());
	//  map.addControl(new GHierarchicalMapTypeControl());
	//  map.addMapType(G_SATELLITE_3D_MAP); // benötigt Plugin
		map.addControl(new GScaleControl());
		map.enableScrollWheelZoom();
		map.getPane(G_MAP_FLOAT_PANE).appendChild(markerinfo);
		GEvent.addListener(map,"infowindowopen",function() { map.savePosition(); } );
		GEvent.addListener(map,"infowindowclose",function() { map.returnToSavedPosition(); } );
		var hp = document.getElementById(id_hp);
		var hp_diag;
		if(hp) {
			hp_diag = new plot(id_hp,"x","h");
			if (hp.className && hp.className.search("no_x")!=-1) hp_xtext="";
			JB_GM_Info(id,"Höhenprofil, ID: "+id_hp,false);
		}
		var sp = document.getElementById(id_sp);
		var sp_diag;
		if(sp)  {
			sp_diag = new plot(id_sp,"x","s");
			if (sp.className && sp.className.search("no_x")!=-1) sp_xtext="";
			JB_GM_Info(id,"Steigungsplot, ID: "+id_sp,false);
		}
		var vp = document.getElementById(id_vp);
		var vp_diag;
		if(vp) {
			vp_diag = new plot(id_vp,"x","v");
			if (vp.className && vp.className.search("no_x")!=-1) vp_xtext="";
			JB_GM_Info(id,"Geschwindigkeitsprofil, ID: "+id_vp,false);
		}
		
		this.Spur = function(fn,mpt) {
			JB_GM_Info(id,"Spur, Filename: "+fn,false);
			if(mpt=="osm_mapnik_map") maptype = osm_mapnik_map;
			else if(mpt=="osm_tah_map") maptype = osm_tah_map;
			else if(mpt=="osm_cycle_map") maptype = osm_cycle_map;
			else maptype = mpt;
			if (fname!=fn) {
				fname = fn;
				JB_GM_Info(id,"Lade Datei "+fname,false);
				GDownloadUrl(fname, function(data, responseCode) {
					if (responseCode != 200) {
						 JB_GM_Info(id,_("Beim Oeffnen der Datei ")+fname+_(" ist der Fehler ")+responseCode+_(" aufgetreten!"),true);
						return;
					}
					dieses.parseGPX(data) ;
					dieses.setMapHead();
					zoom = map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(latmin,lonmin),new GLatLng(latmax,lonmax))); // sw, ne
					dieses.rescale();
					map.setMapType(maptype);
					dieses.checkBoxes()
				} );
			}
			else {
				dieses.checkBoxes()
			}
		} // Spur
		var chkwpt,chktrk,chkrt;
		this.setMapHead = function() {
			JB_GM_Info(id,"setMapHead",false);
			var name = fname.replace(/.+\//,"");
			MapHead.innerHTML = name+": ";
			if(waypoints.length) {
				if(waypoints.length==1) var texte=new Array(_("Wegpunkt")+String.fromCharCode(160));
				else if(waypoints.length>1) var texte=new Array(_("Wegpunkte")+String.fromCharCode(160));
				chkwpt = new JB_CheckBoxGroup(MapHead.id,texte,ID+"_wpt",["black"],legende_wpt,dieses.checkBoxes);
			}
			if(tracks.length) {
				var texte=new Array()
				if(tracks.length==1)
					texte[0] = _("Track") + " ("+ _u('km', tracklens[0], 10, true) +") "+String.fromCharCode(160);
				else if(tracks.length>1) {
					texte[0] = _("Tracks") + " ("+ _u('km', tracklens.sum(), 10, true)+") "+String.fromCharCode(160);
					for(var i=0;i<tracks.length;i++) texte[i+1] = trackNames[i]+" ("+_u('km', tracklens[i], 10, true)+")";
				}
				chktrk = new JB_CheckBoxGroup(MapHead.id,texte,ID+"_trk",tcols,legende_trk,dieses.checkBoxes);
			}
			if(routes.length) {
				var texte=new Array()
				if(routes.length==1)
					texte[0] = _("Route") + " ("+ _u('km', routlens[0], 10, true)+") "+String.fromCharCode(160);
				else if(routes.length>1) {
					texte[0] = _("Routen") + " ("+ _u('km', routlens.sum(), 10, true)+") "+String.fromCharCode(160);
					for(var i=0;i<routes.length;i++) texte[i+1] = routeNames[i]+" ("+ _u('km', routlens[i], 10, true)+")";
				}
				chkrt = new JB_CheckBoxGroup(MapHead.id,texte,ID+"_rt",rcols,legende_rte,dieses.checkBoxes);
			}
		} // setMapHead
		this.checkBoxes = function(obj,ele) {
			var what="";
			if(chkwpt && chkwpt.status[0]) what += "w";
			if(chktrk && chktrk.status[0]) what += "t";
			if(chkrt  && chkrt.status[0] ) what += "r";
			dieses.show(what);
		}
		this.parseGPX = function(data) {
			JB_GM_Info(id,"parseGPX",false);
			var entf = new this.Entfernung();
			tracks = new Array();
			alledaten  = new Array();
			trackNames = new Array();
			trackCMTs = new Array();
			tracklens = new Array() ;
			load = false;
			latmin=1000;latmax=-1000;lonmin=1000;lonmax=-1000;
			var xml = GXml.parse(data);
			var trk = xml.documentElement.getElementsByTagName("trk"); // Tracks
			JB_GM_Info(id,trk.length +"Tracks gefunden",false);
			for(var k=0;k<trk.length;k++) {
				var trkseg = trk[k].getElementsByTagName("trkseg"); // Trackssegmente
				if(trkseg.length==0) trkseg = [trk[k]];
				var name = trk[k].getElementsByTagName("name");
				if(name.length && name[0].firstChild && name[0].firstChild.length && name[0].parentNode == trk[k])
					trackNames[k] = name[0].firstChild.data;
				else
					trackNames[k] = _("Track") + " "+k;
				var cmt = trk[k].getElementsByTagName("cmt");
				if(trcmt && cmt.length && cmt[0].firstChild && cmt[0].firstChild.length && cmt[0].parentNode == trk[k])
					trackCMTs[k] = cmt[0].firstChild.data;
				else
					trackCMTs[k] = "";
				tcols[k] = TrackCols[k%TrackCols.length];
				if(udspcol) {
					var ext = trk[k].getElementsByTagName("extensions");
					if(ext.length) {
						var dspcol = JB_GetElementsByTagNameNS(ext[0],"gpxx","DisplayColor");
						if(dspcol.length && dspcol[0].firstChild && dspcol[0].firstChild.length) tcols[k] = dspcol[0].firstChild.data;
					}
				}
				JB_GM_Info(id,trkseg.length+"Tracksegmente in Track "+k+" gefunden",false);
				for(var j=0;j<trkseg.length;j++) {
					var trkpts = trkseg[j].getElementsByTagName("trkpt"); // Trackpunkte
					var trkptslen = trkpts.length;
					var track = new Array();
					var daten = new Array();
					var x0 = 0;
					if(t_verbinden && k>0) x0 = tracklens.sum() ;
					var tracklen = 0;
					var hflag=hp||sp,tflag=vp,vflag=vp,h,t,v;
					JB_GM_Info(id,trkptslen+" Trackpunkte in Tracksegment "+j+" in Track "+k+" gefunden",false);
					for(var i=0;i<trkptslen;i++) { // Trackdaten erfassen
						var lat = parseFloat(trkpts[i].getAttribute("lat"));
						var lon = parseFloat(trkpts[i].getAttribute("lon"));
						track.push(new GLatLng(lat,lon));
						if(lat<latmin) latmin=lat; if(lat>latmax) latmax=lat;
						if(lon<lonmin) lonmin=lon; if(lon>lonmax) lonmax=lon;
						if(hflag && trkpts[i].getElementsByTagName("ele").length && trkpts[i].getElementsByTagName("ele")[0].hasChildNodes())
							h = parseFloat(trkpts[i].getElementsByTagName("ele")[0].firstChild.data);
						else {
							hflag = false;
							h = -1e6;
						}
						if(tflag && trkpts[i].getElementsByTagName("time").length && trkpts[i].getElementsByTagName("time")[0].hasChildNodes())
							t = JB_utc2msec(trkpts[i].getElementsByTagName("time")[0].firstChild.data);
						else {
							tflag = false;
							t = -1;
						}
						if(vflag && rdSpeed && trkpts[i].getElementsByTagName("speed").length && trkpts[i].getElementsByTagName("speed")[0].hasChildNodes())
							v = parseFloat(trkpts[i].getElementsByTagName("speed")[0].firstChild.data);
						else {
							v = -1;
							vflag = false;
						}
						if(i==0) entf.init(lat,lon) ;
						var dx = entf.rechne(lat,lon);
						tracklen += dx;
						daten.push({lat:lat,lon:lon,x:tracklen+x0,t:t,h:h,dx:dx,v:v});
					}
					if(hflag) {
						daten = JB_smoth(daten,"x","h","hs",trkptslen/50); 
						daten = JB_diff(daten,"x","hs","s",0.1);
						daten = JB_smoth(daten,"x","s","s",trkptslen/50);
					}
					else {
						hp = false;
						sp = false;
					}
					if(tflag && !vflag) {
						daten = JB_smoth(daten,"t","x","xs",trkptslen/200); 
						daten = JB_diff(daten,"t","xs","v",3600000);
						daten = JB_smoth(daten,"x","v","v",trkptslen/200);
					}
					else if(!tflag && !vflag) {
						vp = false;
					}
				}
				if(hflag) JB_GM_Info(id,"Höhendaten gefunden",false); else JB_GM_Info(id,"Keine Höhendaten gefunden",false);
				if(tflag) JB_GM_Info(id,"Zeitdaten gefunden",false); else JB_GM_Info(id,"Keine Zeitdaten gefunden",false);
				if(vflag) JB_GM_Info(id,"Geschwindigkeitsdaten gefunden",false); else JB_GM_Info(id,"Keine Geschwindigkeitsdate gefunden",false);
				alledaten.push(daten);
				tracks.push(track);
				tracklens.push(Math.round(tracklen*10)/10);
			}
			var rte = xml.documentElement.getElementsByTagName("rte"); // Routen
			JB_GM_Info(id,rte.length +" Routen gefunden",false);
			routes = new Array();
			routeNames = new Array();
			routeCMTs = new Array();
			routlens = new Array();
			for(var j=0;j<rte.length;j++) {
				var rtepts = rte[j].getElementsByTagName("rtept");
				JB_GM_Info(id,rtepts.length +" Zwischenziele gefunden",false);
				var route = new Array();
				var routlen = 0;
				var name = rte[j].getElementsByTagName("name");
				if(name.length && name[0].firstChild && name[0].firstChild.length && name[0].parentNode == rte[j])
					routeNames[j] = name[0].firstChild.data;
				else
					routeNames[j] = _("Route") + " "+j;
				var cmt = rte[j].getElementsByTagName("cmt");
				if(trcmt && cmt.length && cmt[0].firstChild && cmt[0].firstChild.length && cmt[0].parentNode == rte[j])
					routeCMTs[j] = cmt[0].firstChild.data;
				else
					routeCMTs[j] = "";
				for(var i=0;i<rtepts.length;i++) { // Zwischenziele
					var lat = parseFloat(rtepts[i].getAttribute("lat"));
					var lon = parseFloat(rtepts[i].getAttribute("lon"));
					if(i==0) entf.init(lat,lon) ;
					routlen += entf.rechne(lat,lon);
					if(lat<latmin) latmin=lat; if(lat>latmax) latmax=lat;
					if(lon<lonmin) lonmin=lon; if(lon>lonmax) lonmax=lon;
					route.push(new GLatLng(lat,lon));
					var ext = rtepts[i].getElementsByTagName("extensions");
					if(ext.length) {
						var rpts = JB_GetElementsByTagNameNS(ext[0],"gpxx","rpt"); // Routenpunkte
						JB_GM_Info(id,rpts.length +" Routenpunkte (Garmin) gefunden",false);
						for(var k=0;k<rpts.length;k++) {
							var lat = parseFloat(rpts[k].getAttribute("lat"));
							var lon = parseFloat(rpts[k].getAttribute("lon"));
							routlen += entf.rechne(lat,lon);
							if(lat<latmin) latmin=lat; else if(lat>latmax) latmax=lat;
							if(lon<lonmin) lonmin=lon; else if(lon>lonmax) lonmax=lon;
							route.push(new GLatLng(lat,lon));
						}
					}
				}
				routes.push(route);
				routlens.push(Math.round(routlen*10)/10);
			}
			var wpts = xml.documentElement.getElementsByTagName("wpt"); // Waypoints
			JB_GM_Info(id,wpts.length +" Wegpunkte gefunden",false);
			waypoints = new Array();
			for(var i=0;i<wpts.length;i++) { // Wegpunktdaten
				var wpt = wpts[i];
				var lat = parseFloat(wpt.getAttribute("lat"));
				var lon = parseFloat(wpt.getAttribute("lon"));
				if(lat<latmin) latmin=lat; if(lat>latmax) latmax=lat;
				if(lon<lonmin) lonmin=lon; if(lon>lonmax) lonmax=lon;
				var waypoint = new Object();
				waypoint.lat = lat;
				waypoint.lon = lon;
				waypoint.name = "";
				waypoint.cmt = "";
				waypoint.desc = "";
				var name = wpt.getElementsByTagName("name");
				var cmt = wpt.getElementsByTagName("cmt");
				var desc = wpt.getElementsByTagName("desc");
				if(name.length && name[0].firstChild && name[0].firstChild.length)
					waypoint.name = name[0].firstChild.data;
				if(cmt.length && cmt[0].firstChild && cmt[0].firstChild.length)
					waypoint.cmt = cmt[0].firstChild.data;
				if(desc.length && desc[0].firstChild && desc[0].firstChild.length)
					waypoint.desc = desc[0].firstChild.data;
				waypoints.push(waypoint);
			}
			load = true;
		} // parseGPX
		this.showWpts = function() {
			if (load) {
				for(var i=0;i<waypoints.length;i++) {
					var waypoint = waypoints[i];
					if(checkImageName(waypoint.name)) {
						map.addOverlay(createImgMarker(waypoint));
					}
					else if (waypoint.name.length || waypoint.cmt.length)
						map.addOverlay(createTxtMarker(waypoint));
					else
						map.addOverlay(new GMarker(new GLatLng(waypoint.lat,waypoint.lon)));
				}
			}
		} // showWpts
		this.showTracks = function() {
			if (load) {
				if(alledaten.length>1) {
					for(var i=0;i<alledaten.length;i++) {
						var daten = alledaten[i];
						if(daten.length && chktrk.status[i+1]) {
							if(hp) hp_diag.scale(daten);
							if(sp) sp_diag.scale(daten);
							if(vp) vp_diag.scale(daten);
						}
					}
				}
				else if(alledaten.length==1) {
					var daten = alledaten[0];
					if(daten.length) {
						if(hp) hp_diag.scale(daten);
						if(sp) sp_diag.scale(daten);
						if(vp) vp_diag.scale(daten);
					}
				}
				if(hp) hp_diag.frame(50,35,hp_xtext,hp_ytext, 'km', 'm');
				if(sp) sp_diag.frame(50,35,sp_xtext,sp_ytext, 'km', '%');
				if(vp) vp_diag.frame(50,35,vp_xtext,vp_ytext, 'km', 'km/h');
				if(tracks.length>1) {
					for(var i=0;i<tracks.length;i++) if(chktrk.status[i+1]) {
						var info = "<strong>"+trackNames[i]+" ("+ _u('km', tracklens[i], 10, true) +")</strong>"
										 + "<br />"+trackCMTs[i];
						this.makePolyline(map,tracks[i],tcols[i%tcols.length],twidth,topac,widtho,colo,info);
						if(alledaten[i].length) {
							if(hp) hp_diag.plot(alledaten[i],tcols[i%tcols.length]);
							if(sp) sp_diag.plot(alledaten[i],tcols[i%tcols.length]);
							if(vp) vp_diag.plot(alledaten[i],tcols[i%tcols.length]);
						}
					}
					if(t_verbinden) {
						var d_t = new Array();
						for(var i=0;i<alledaten.length;i++) if(chktrk.status[i+1]) d_t = d_t.concat(alledaten[i]);
						if(d_t.length) {
							if(hp) hp_diag.markeron(d_t,dieses.markerstart,dieses.markerstop,dieses.markermove,"Linie") ;
							if(sp) sp_diag.markeron(d_t,dieses.markerstart,dieses.markerstop,dieses.markermove,"Linie") ;
							if(vp) vp_diag.markeron(d_t,dieses.markerstart,dieses.markerstop,dieses.markermove,"Linie") ;
						}
					}
				}
				else if(tracks.length==1) {
					if(chktrk.status[0]) {
						var info = "<strong>"+trackNames[0]+" ("+ _u( 'km', tracklens[0], 10, true) +")</strong>"
										 + "<br />"+trackCMTs[0];
						this.makePolyline(map,tracks[0],tcols[0],twidth,topac,widtho,colo,info);
						if(alledaten[0].length) {
							if(hp) {
								hp_diag.plot(alledaten[0],tcols[0]);
								hp_diag.markeron(alledaten[0],dieses.markerstart,dieses.markerstop,dieses.markermove,"Linie") ;
							}
							if(sp) {
								sp_diag.plot(alledaten[0],tcols[0]);
								sp_diag.markeron(alledaten[0],dieses.markerstart,dieses.markerstop,dieses.markermove,"Linie") ;
							}
							if(vp) {
								vp_diag.plot(alledaten[0],tcols[0]);
								vp_diag.markeron(alledaten[0],dieses.markerstart,dieses.markerstop,dieses.markermove,"Linie") ;
							}
						}
					}
				}
			}
		} // showTracks
		this.showRoutes = function() {
			if (load) {
				if(routes.length>1) {
					for(var i=0;i<routes.length;i++) if(chkrt.status[i+1]) {
						var info = "<strong>"+routeNames[i]+" ("+_u('km', routlens[i], 10, true)+")</strong>"
										 + "<br />"+routeCMTs[i];
						this.makePolyline(map,routes[i],rcols[i%tcols.length],rwidth,ropac,widtho,colo,info);//routeNames[i]+"<br />"+Number(routlens[i].toPrecision(10).toString(10))+"km";
					}
				}
				else if(routes.length==1) {
					if(chkrt.status[0])
						this.makePolyline(map,routes[0],rcols[0],rwidth,ropac,widtho,colo,routeNames[0]+"<br />"+_u('km', routlens[0], 10 , true));
				}
			}
		} // showRoutes
		this.show = function(what) {
			map.clearOverlays() ;
			if(hp) hp_diag.clear();
			if(sp) sp_diag.clear();
			if(vp) vp_diag.clear();
			if (what.search("w") != -1 ) dieses.showWpts();
			if (what.search("t") != -1 ) dieses.showTracks();
			if (what.search("r") != -1 ) dieses.showRoutes();
		} // show
		this.rescale = function() {
			if(load) {
				map.setCenter(new GLatLng((latmax+latmin)/2,(lonmax+lonmin)/2), zoom);
			}
		} // rescale
		this.Entfernung = function() {
			var ls,bs;
			this.init = function(b,l) {
				ls = l;
				bs = b;
			}
			this.rechne = function(b,l) {
				var e = new GLatLng(bs,ls).distanceFrom(new GLatLng(b,l));
				ls = l;
				bs = b;
				return e/1000;
			}
		} // Entfernung
		this.showtrackmarker = function() {
			JB_GM_Info(id,"showtrackmarker",false);
			movemarker = new GMarker(tracks[0][0],markericon);
			map.addOverlay(movemarker);
			markerinfo.style.visibility = "visible";
		} // showtrackmarker
		this.hidetrackmarker = function() {
			map.removeOverlay(movemarker);
			markerinfo.style.visibility = "hidden";
		} // hidetrackmarker
		this.settrackmarker = function(a) {
			map.removeOverlay(movemarker);
			movemarker = new GMarker(new GLatLng(a.lat,a.lon),markericon);
			map.addOverlay(movemarker);
			var point=map.getCurrentMapType().getProjection().fromLatLngToPixel(map.fromDivPixelToLatLng(new GPoint(0,0),true),map.getZoom());
			var offset=map.getCurrentMapType().getProjection().fromLatLngToPixel(movemarker.getPoint(),map.getZoom());
			var anchor=movemarker.getIcon().iconAnchor;
			var width=movemarker.getIcon().iconSize.width;
			var height=markerinfo.clientHeight;
			var pos = new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(offset.x - point.x - anchor.x + width, offset.y - point.y -anchor.y -height));
			pos.apply(markerinfo);
		} //  movetrackmarker
		this.markerstart = function() {
			JB_GM_Info(id,"markerstart",false);
			dieses.showtrackmarker();
			if(hp) hp_diag.showmarker("Linie");
			if(vp) vp_diag.showmarker("Linie");
			if(sp) sp_diag.showmarker("Linie");
		} // markerstart
		this.markerstop = function() {
			dieses.hidetrackmarker();
			JB_GM_Info(id,"markerstop",false);
			if(hp) hp_diag.hidemarker();
			if(vp) vp_diag.hidemarker();
			if(sp) sp_diag.hidemarker();
		} // markerstop
		this.markermove = function(p,a) {
			var info = _('Strecke')+':&nbsp;'+_u('km', a.x, 1, true);
			if(hp) {
				info += "<br />" + _('Höhe') + ":&nbsp;"+_u('m', Math.round(a.h), 0, true);
				hp_diag.setmarker(a,"Linie");
			}
			if(vp) {
				info += "<br />" + _('Geschw.') + ":&nbsp;"+_u('km/h', Math.round(a.v), 0, true);
				vp_diag.setmarker(a,"Linie");
			}
			if(sp) {
				info += "<br />" + _('Stg.') + ":&nbsp;"+Math.round(a.s)+"%";
				sp_diag.setmarker(a,"Linie");
			}
			markerinfo.innerHTML = info;
			dieses.settrackmarker(a);
		} // markermove
		var createImgMarker = function(waypoint) {
			var marker = new GMarker(new GLatLng(waypoint.lat,waypoint.lon),scenicicon);
			GEvent.addListener(marker, "click", function() {
				var bild = new Image(); 
				bild.onload = function() {
					marker.openInfoWindowHtml("<img src='"+waypoint.name+"'\/><br\/>"+waypoint.cmt);
				};
				bild.src = waypoint.name;
			});
			return marker;
		} // createImgMarker
		var createTxtMarker = function(waypoint) {
			var marker = new GMarker(new GLatLng(waypoint.lat,waypoint.lon),{title:waypoint.name});
			GEvent.addListener(marker, "click", function() {
				marker.openInfoWindowHtml("<strong>"+waypoint.name+"<\/strong><br\/>"+waypoint.cmt);
			});
			return marker;
		} // createTxtMarker
		var checkImageName = function(url) {
			var ext = url.substr(url.lastIndexOf(".")+1).toLowerCase();
			return (ext=="jpg" || ext=="jpeg" || ext=="png" || ext=="gif") ;
		} //  checkImageName
		this.makePolyline = function(map,line,col,width,opac,widtho,colo,info) {
			// var PL = new GPolyline(line,col,width,opac);
			var PL = polylineEncoder.dpEncodeToGPolyline(line,col,width,opac);
			if(tOver) {
				GEvent.addListener(PL,"mouseover",function(latlng) {
					JB_GM_Info("","Line over, "+this.getVertexCount()+" Punkte",false);
					this.setStrokeStyle({color:colo,weight:widtho});
				});
				GEvent.addListener(PL,"mouseout", function() {
					JB_GM_Info("","Line out",false);
					this.setStrokeStyle({color:col,weight:width}); 
				});
				GEvent.addListener(PL,"click", function(overlay,latlng) {
					JB_GM_Info("","Line click "+overlay+"  "+latlng,false);
					map.openInfoWindow(overlay,info);
				});
			}
			map.addOverlay(PL);
		} // makePolyline
	} // makeMap

	function JB_GM_Info(id,Infotext,alertflag) {
		if(GPXVIEW_Debuginfo) GLog.write("Map "+id+": "+Infotext);
		if(alertflag) alert(Infotext);
	} // GM_Info

	function JB_GetElementsByTagNameNS(ele,namespace,name) {
		var alltags = ele.getElementsByTagName("*");
		var tagname = namespace.toLowerCase()+":"+name.toLowerCase()
		var tags = new Array();
		for(var i=0;i<alltags.length;i++) if(alltags[i].nodeName.toLowerCase()==tagname) tags.push(alltags[i]);
		return tags;
	} // JB_GetElementsByTagNameNS(ele,namespace,name)

	function JB_CheckBoxGroup(id,Texte,Label,Farbe,def_stat,clickFunc) {
		var dieses = this;
		var nbx = Texte.length;
		this.nboxen = nbx;
		this.status = new Array(nbx); for(var i=0;i<nbx;i++) this.status[i] = def_stat ;
		var ele;
		var box=document.createElement("div");
		box.style.position = "absolute";
		box.style.display = "inline";
		box.style.height = "1.4em";
		box.style.overflow = "hidden";
		box.style.backgroundColor = "";
		box.style.zIndex = 1000;
		box.style.margin = "0";
		box.style.padding = "0";
		box.onmouseover = function() {
			this.style.height = "";
			this.style.overflow = "";
			this.style.backgroundColor = "white";
			this.style.paddingRight = "0.3em";
			this.style.paddingBottom = "0.2em";
		};
		box.onmouseout  = function() {
			this.style.height = "1.4em";
			this.style.overflow = "hidden";
			this.style.backgroundColor = "";
			this.style.paddingRight = "";
			this.style.paddingBottom = "";
		};
		for(var i=0;i<nbx;i++) {
			ele = document.createElement("input");
			ele.type = "checkbox";
			ele.id = Label + i;
			ele.nr = i;
			if(i==0) ele.onclick = function() {
				var l = nbx;
				var n = Label;
				var status = this.checked;
				dieses.status[this.nr] = status;
				for(var j=1;j<l;j++) {
					document.getElementById(n+j).checked=status;
					dieses.status[j] = status;
				}
				clickFunc(dieses,this);
			};
			else     ele.onclick = function() {
				var l = nbx;
				var n = Label;
				var status = false;
				for(var j=1;j<l;j++) status |= document.getElementById(n+j).checked;
				document.getElementById(n+"0").checked = status;
				dieses.status[0] = status==true;
				dieses.status[this.nr] = this.checked;
				clickFunc(dieses,this);
			};
			box.appendChild(ele);
			ele.checked = def_stat;
			ele=document.createElement("span");
			if(i==0 && nbx==1) ele.style.color=Farbe[0];
			else if(i) ele.style.color=Farbe[(i-1)%Farbe.length];
			ele.appendChild(document.createTextNode(Texte[i]));
			box.appendChild(ele);
			if(i<Texte.length-1) box.appendChild(document.createElement("br"));
		}
		ele=document.getElementById(id);
		ele.appendChild(box);
		var spn=document.createElement("span"); // Platzhalter
		spn.appendChild(document.createTextNode(" X "+Texte[0]+" "));
		spn.style.visibility="hidden";
		ele.appendChild(spn);
	} // JB_CheckBoxGroup

	function addEvent (obj, type, fn) {
		 if (obj.addEventListener) {
				obj.addEventListener(type, fn, false);
		 } else if (obj.attachEvent) {
				obj.attachEvent('on' + type, function () {
					 return fn.call(obj, window.event);
				});
		 }
	} // addEvent
	function JB_utc2msec(utcdate) {
		var jahr = utcdate.substr(0,4);
		var monat = utcdate.substr(5,2)*1-1;
		var tag = utcdate.substr(8,2);
		var stunde = utcdate.substr(11,2);
		var minute = utcdate.substr(14,2);
		var sekunde = utcdate.substr(17,2);
		return Date.UTC(jahr,monat,tag,stunde,minute,sekunde);
	} // utc2msec
	function JB_smoth(a,x,y,ys,range) {
		var l=a.length,l1=l-1;
		var t = new Array(l); for(var i=0;i<l;i++) { t[i] = {}; t[i][ys]=a[i][y]; for(var o in a[i]) t[i][o] = a[i][o]; }
		if(l<2*range) return t;
		var rr,fak,faksum,sum,d;
		var r = Math.floor(range/2);
		for(var i=0;i<l;i++) {
			if(i<r) rr=i;
			else if(i>(l1-r)) rr=l1-i;
			else rr=r;
			if(rr>0) {
				sum = faksum = 0;
				d = Math.max(Math.abs(a[i][x]-a[i-rr][x]),Math.abs(a[i][x]-a[i+rr][x]));
				if(d==0) d=1;
				for(var j=i-rr;j<=i+rr;j++) {
					fak = (d-Math.abs(a[j][x]-a[i][x]))*rr/d;
	//        fak = 1+rr-Math.abs(j-i);
					sum += a[j][y]*fak;
					faksum += fak;
				}
				t[i][ys] = sum/faksum;
			}
		}
		return t;
	} // smoth
	function JB_diff(a,x,y,d,fak) {
		var l=a.length,l1=l-1;
		if(l<3) { for(var i=0;i<l;i++) a[i][d] = 0; return a; }
		var dx,dy;
		dx = a[1][x]-a[0][x] ;
		dy = a[1][y]-a[0][y] ;
		if(dx==0) a[0][d] = 0;
		else      a[0][d] = fak*dy/dx
		for(var i=1;i<l1;i++) {
			dx = a[i+1][x]-a[i-1][x] ;
			dy = a[i+1][y]-a[i-1][y] ;
			if(dx==0) a[i][d] = a[i-1][d];
			else      a[i][d] = fak*dy/dx
		}
		dx = a[l1-1][x]-a[l1][x] ;
		dy = a[l1-1][y]-a[l1][y] ;
		if(dx==0) a[l1][d] = a[l1-1][d];
		else      a[l1][d] = fak*dy/dx
		return a;
	} // diff

	Array.prototype.sum=function() {
	 for(var s=0,i=0;i<this.length;i++)s+=this[i];
	 return s;
	} // sum

	// gra
	// Version vom 28.5.09
	// Jürgen Berkemeier
	// www.j-berkemeier.de
	function gra(ID) {
	 var feld=document.getElementById(ID);
	 var dv=document.createElement("div");
	 var cont=feld.appendChild(dv);
	 var buf=document.createElement("div");
	 this.w=parseInt(feld.offsetWidth-1);
	 this.h=parseInt(feld.offsetHeight-1);
	 var maxbuf=1;
	 var bufsize=1;
	 var sp = document.createElement("div");
	 var col="#000000";
	 sp.style.position="absolute";
	 sp.style.width="1px";
	 sp.style.height="1px";
	 sp.style.overflow="hidden";
	 sp.style.left="0px";
	 sp.style.top="0px";
	 sp.style.backgroundColor=col;
	 this.setbuf=function(siz) {
		bufsize=maxbuf=Math.max(1,siz);
	 }
	 this.flush=function() {
		cont.appendChild(buf);
		buf=document.createElement("div");
		bufsize=maxbuf;
	 }
	 this.punkt=function(x,y,c) {
		if (x<0 || y<0 || x>this.w || y>this.h) return;
		if(c!=col) {col=c;sp.style.backgroundColor=col;}
		var pkt = sp.cloneNode(true);
		pkt.style.left=Math.round(x)+"px";
		pkt.style.top=Math.round(this.h-y)+"px";
		buf.appendChild(pkt);
		bufsize--; if(!bufsize) this.flush();
	 } // punkt
	 this.ver_linie=function(x,y1,y2,c) {
		if (x<0 || x>this.w) return;
		if ( (y1<0&&y2<0) || (y1>this.h&&y2>this.h) ) return;
		if(c!=col) {col=c;sp.style.backgroundColor=col;}
		y1=Math.max(0,Math.min(this.h,y1));
		y2=Math.max(0,Math.min(this.h,y2));
		var vl = sp.cloneNode(true);
		vl.style.left=Math.round(x)+"px";
		vl.style.top=Math.round(this.h-Math.max(y1,y2))+"px";
		vl.style.height=Math.round(Math.abs(y2-y1)+1)+"px";
		buf.appendChild(vl);
		bufsize--; if(!bufsize) this.flush();
	 } // ver_linie
	 this.hor_linie=function(x1,x2,y,c) {
		if (y<0 || y>this.h) return;
		if ( (x1<0&&x2<0) || (x1>this.w&&x2>this.w) ) return;
		if(c!=col) {col=c;sp.style.backgroundColor=col;}
		x1=Math.max(0,Math.min(this.w,x1));
		x2=Math.max(0,Math.min(this.w,x2));
		var hl = sp.cloneNode(true);
		hl.style.left=Math.round(Math.min(x1,x2))+"px";
		hl.style.top=Math.round(this.h-y)+"px";
		hl.style.width=Math.round(Math.abs(x2-x1)+1)+"px";
		buf.appendChild(hl);
		bufsize--; if(!bufsize) this.flush();
	 } // hor_linie
	 this.linie=function(xs,ys,xe,ye,c) {
	//  var flag=(maxbuf==1);
	//  if(flag) maxbuf=1000;
		xs=Math.round(xs); xe=Math.round(xe);
		ys=Math.round(ys); ye=Math.round(ye);
		var dx=xe-xs;
		var dy=ye-ys;
		if (dx==0 && dy==0) this.punkt(xs,ys,c)
		else if (dx==0) this.ver_linie(xs,ys,ye,c);
		else if (dy==0) this.hor_linie(xs,xe,ys,c);
		else {
		 var adx=Math.abs(dx);
		 var ady=Math.abs(dy);
		 var d=Math.min(adx,ady);
		 dx=dx/d;
		 dy=dy/d;
		 if (adx==ady) {
			for(var x=xs,y=ys,i=0;i<=d;x+=dx,y+=dy,i++) this.punkt(x,y,c) ;
		 }
		 else if (adx<ady) {
			var dd=dy/Math.abs(dy);
			this.ver_linie(xs,ys,ys+dy/2-dd,c);
			for(var x=xs+dx,y=ys+dy/2,i=1;i<d;x+=dx,y+=dy,i++) this.ver_linie(x,y,y+dy-dd,c) ;
			this.ver_linie(xe,ye-(dy+dd)/2,ye,c);
		 }
		 else {
			var dd=dx/Math.abs(dx);
			this.hor_linie(xs,xs+dx/2-dd,ys,c);
			for(var x=xs+dx/2,y=ys+dy,i=1;i<d;x+=dx,y+=dy,i++) this.hor_linie(x,x+dx-dd,y,c) ;
			this.hor_linie(xe-(dx+dd)/2,xe,ye,c);
		 }
		}
	//  if(flag) {maxbuf=1;this.flush();}
	 } // linie
	 this.text=function(x,y,size,color,text,align) {
		var align_h = "m";
		var align_v = "m";
		if(align && align.length) {
		 align_h = align.substr(0,1);
		 if(align.length>1) align_v = align.substr(1,1);
		}
		var pkt = document.createElement("div");
		pkt.style.position = "absolute";
		pkt.style.fontSize = size+"px";
		pkt.style.color = color;
		pkt.style.textAlign = "center";
		pkt.innerHTML = text;
		cont.appendChild(pkt);
		switch(align_h) {
		 case "l": default: pkt.style.left = Math.round(x) + "px"; break;
		 case "m": pkt.style.left = Math.round(x) - pkt.offsetWidth/2 + "px"; break
		 case "r": pkt.style.left = Math.round(x) - pkt.offsetWidth + "px"; break
		}
		switch(align_v) {
		 case "o": default: pkt.style.top = Math.round(this.h-y) + "px"; break;
		 case "m": pkt.style.top = Math.round(this.h-y) - pkt.offsetHeight/2 + "px"; break;
		 case "u": pkt.style.top = Math.round(this.h-y) - pkt.offsetHeight + "px"; break;
		}
	 } // text
	 this.del=function() {
		feld.removeChild(cont);
		delete cont;
		delete buf;
		var dv=document.createElement("div");
		cont=feld.appendChild(dv);
		buf=document.createElement("div");
		bufsize=maxbuf;
	 } // del
	} // gra

	// plot
	// Version vom 29. 10. 2009
	// Jürgen Berkemeier
	// www.j-berkemeier.de
	var plot = function(id,xstr,ystr) {
		var JB_log10 = function(x) { return Math.log(x)/Math.LN10; }
		var JB_toString = function(n) { n=(typeof n === 'number')?n:parseFloat(n); return n.toFixed((n>10)?0:1); }
		var JB_makediv = function(parentnode,id,x0,y0,width,height) {
			var ele = document.createElement("div");
			ele.id = id;
			ele.style.position = "absolute";
			ele.style.left = x0 + "px";
			ele.style.top = y0 + "px";
			ele.style.width = width + "px";
			ele.style.height = height + "px";
			parentnode.appendChild(ele);
			return ele;
		}
		var plotid = id+"plot";
		var plotidm = id+"plotm";
		var idxlabel = id+"xlabel";
		var idylabel = id+"ylabel";
		var xobj = xstr?xstr:"x";
		var yobj = ystr?ystr:"y";
		JB_GM_Info(id,xobj+" "+yobj,false);
		var xmin=0,xmax=0,ymin=0,ymax=0;
		var xfak=0,yfak=0;
		var dx,dy,fx,fy;
		var gr = null;
		var xlabel = null;
		var ylabel = null;
		var feld = document.getElementById(id) ;
		var w = parseInt(feld.offsetWidth-1);
		var h = parseInt(feld.offsetHeight-1);
		var ifeld = document.createElement("div");
		var marker;
		ifeld.style.position = "absolute";
		ifeld.style.width = w + "px";
		ifeld.style.height = h + "px";
		feld.appendChild(ifeld);

		this.scale = function(a) {
			if(xmin==xmax) {
				xmax = xmin = a[0][xobj];
				ymax = ymin = a[0][yobj];
			}
			for(var i=0;i<a.length;i++) {
				var t = a[i];
				if(t[xobj]<xmin) xmin = t[xobj];
				if(t[xobj]>xmax) xmax = t[xobj];
				if(t[yobj]<ymin) ymin = t[yobj];
				if(t[yobj]>ymax) ymax = t[yobj];
			}
			JB_GM_Info(id,xobj+": "+xmin+" ... "+xmax+"; "+yobj+": "+ymin+" ... "+ymax,false);
			if(xmax==xmin) { xmin -= 0.5; xmax += 0.5; }
			dx = (xmax - xmin)/100; xmin -= dx; xmax += dx;
			dx = xmax - xmin;
			fx = Math.pow(10,Math.floor(JB_log10(dx))-1);
			xmin = Math.floor(xmin/fx)*fx;
			xmax = Math.ceil(xmax/fx)*fx;
			if(ymax==ymin) { ymin -= 0.5; ymax += 0.5; }
			dy = (ymax - ymin)/100; ymin -= dy; ymax += dy;
			dy = ymax - ymin;
			fy = Math.pow(10,Math.floor(JB_log10(dy))-1);
			ymin = Math.floor(ymin/fy)*fy;
			ymax = Math.ceil(ymax/fy)*fy;
		} // plot.scale
		this.clear = function() {
			ifeld.innerHTML = "";
			xmax = xmin = ymax = ymin = xfak = yfak = 0;
		} // plot.clear
		this.frame = function(x0,y0,xl,yl,xu,yu) {
			ifeld.innerHTML = "";
			JB_makediv(ifeld,plotid,x0,0,w-x0,h-y0);
			if(xl.length) JB_makediv(ifeld,idxlabel,x0,h-y0,w-x0,y0);
			JB_makediv(ifeld,idylabel,0,0,x0,h-y0);
			JB_makediv(ifeld,plotidm,x0,0,w-x0,h-y0);
			if(xl.length) xlabel=new gra(idxlabel);
			ylabel=new gra(idylabel);
			gr=new gra(plotid);
			gr.setbuf(1000);
			xfak = gr.w/(xmax-xmin);
			yfak = gr.h/(ymax-ymin);
			if(xl.length) xlabel.text(xlabel.w/2,0,16,"black",xl,"mu");
			ylabel.text(7,ylabel.h/2,16,"black",yl,"mm");
			var tx = 100*dx/gr.w;
			var ty = gr.h<250 ?  50*dy/gr.h : 100*dy/gr.h;
			var tx10 = Math.pow(10,Math.floor(JB_log10(tx)));
			tx = Math.round(tx/tx10);
			var ty10 = Math.pow(10,Math.floor(JB_log10(ty)));
			ty = Math.round(ty/ty10);
			tx = Number(String(tx).replace(/3/,"2").replace(/[4567]/,"5").replace(/[89]/,"10"));
			ty = Number(String(ty).replace(/3/,"2").replace(/[4567]/,"5").replace(/[89]/,"10"));
			tx *= tx10;
			ty *= ty10;
			var mxmin = Math.ceil(xmin/tx)*tx;
			var mymin = Math.ceil(ymin/ty)*ty;
			for(var x=mxmin;x<=xmax;x+=tx) {
				gr.linie((x-xmin)*xfak,0,(x-xmin)*xfak,gr.h,"gray");
				if(xl.length) xlabel.text((x-xmin)*xfak,xlabel.h,14,"black",JB_toString(_u(xu, x, 10, false)),"mo");
			}
			for(var y=mymin;y<=ymax;y+=ty) {
				gr.linie(0,(y-ymin)*yfak,gr.w,(y-ymin)*yfak,"gray");
				ylabel.text(ylabel.w,(y-ymin)*yfak,14,"black",JB_toString(_u(yu, y, 10, false)),"rm");
			}
			var rahmen=new gra(plotid);
			rahmen.linie(       0,       0,rahmen.w,       0,"black");
			rahmen.linie(rahmen.w,       0,rahmen.w,rahmen.h,"black");
			rahmen.linie(rahmen.w,rahmen.h,       0,rahmen.h,"black");
			rahmen.linie(       0,rahmen.h,       0,       0,"black");
		} // plot.frame
		this.plot = function(a,col) {
			for(var i=0;i<a.length-1;i++)
				gr.linie(
				 (a[i][xobj]-xmin)*xfak,
				 (a[i][yobj]-ymin)*yfak,
				 (a[i+1][xobj]-xmin)*xfak,
				 (a[i+1][yobj]-ymin)*yfak,
				 col);
			gr.flush();
		} // plot.plot)
		this.showmarker = function(markertype) {
			var pele = document.getElementById(plotid);
			marker = document.createElement("div");
			marker.style.position = "absolute";
			marker.style.display = "none";
			if(markertype=="Punkt") {
				marker.style.fontSize = "32px";
				var txt=document.createTextNode(String.fromCharCode(8226)) ; // Kreis als Zeichen: &bull; oder &#8226; evtl auch 8729
				marker.appendChild(txt);
			}
			else {
				marker.style.top = "0";
				marker.style.height = gr.h + "px" ;
				marker.style.width = "1px";
				marker.style.backgroundColor = "black";
			}
			pele.appendChild(marker);
		} // plot.showmarker
		this.hidemarker = function() {
			marker.style.display = "none";
		} // plot.hidemarker
		this.setmarker = function(a,markertype) {
			marker.style.display = "";
			if(markertype=="Punkt") {
				marker.style.left = Math.round((a[xobj]-xmin)*xfak) - marker.offsetWidth/2 + "px";
				marker.style.top = Math.round(gr.h - (a[yobj]-ymin)*yfak) - marker.offsetHeight/2 + "px";
			}
			else {
				marker.style.left = Math.round((a[xobj]-xmin)*xfak) + "px";
			}
		} // plot.setmarker
		this.markeron = function(a,callback_over,callback_out,callback_move,markertype) {
			var dieses = this;
			var posx=0;
			var mele = document.getElementById(plotidm);
			mele.onmouseover = function(e) {
				if(!e) e = window.event;
				e.cancelBubble = true;
				if (e.stopPropagation) e.stopPropagation();
				mele.onmousemove = function(e) {
					if(!e) e = window.event;
					e.cancelBubble = true;
					if (e.stopPropagation) e.stopPropagation();
					posx = e.layerX ? e.layerX : e.offsetX;
					var x = posx/xfak+xmin;
					var al = a.length;
					var p,pi;
					if(x<=a[0][xobj]) pi=0;
					else if(x>=a[al-1][xobj]) pi=al-1;
					else {
						p = al/2;
						pi = Math.floor(p);
						var dp = Math.ceil(p/2);
						do {
							var apx = a[pi][xobj];
							if(x<apx) { p -= dp; if(p<0) p=0; }
							else if(x>apx) { p += dp; if(p>al-1) p=al-1; }
							else break;
							pi = Math.floor(p);
							dp = dp/2;
						} while(dp>=0.5) ;
					}
	//                    dieses.setmarker(a[pi],markertype);
					if(callback_move && typeof(callback_move)=="function") callback_move(pi,a[pi]);
					return false;
				}
				if(callback_over && typeof(callback_over)=="function") callback_over();
				return false;
			}
			mele.onmouseout = function(e) {
				if(!e) e = window.event;
	//      dieses.hidemarker();
				mele.onmousemove = null;
				if(callback_out && typeof(callback_out)=="function") callback_out();
				return false;
			}
		} // plot.markeron
		this.markeroff = function() {
			var ele = document.getElementById(plotid);
			ele.onmousemove = null;
			ele.onmouseout = null;
		} // plot.markeroff
	} // plot

	// PolylineEncoder.js copyright Mark McClure  April/May 2007
	// V 2.1  July 2007
	// http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/PolylineEncoderClass.html
	// Geringfügig angepasst von JB
	var PolylineEncoder = function() {
		this.numLevels = 18;
		this.zoomFactor = 2;
		this.verySmall = 0.00001;
		this.forceEndpoints = true;
		this.zoomLevelBreaks = new Array(this.numLevels);
		for(var i = 0; i < this.numLevels; i++) {
			this.zoomLevelBreaks[i] = this.verySmall*Math.pow(this.zoomFactor, this.numLevels-i-1);
		}
	} 
	PolylineEncoder.prototype.dpEncode = function(points) {
		var absMaxDist = 0;
		var stack = [];
		var dists = new Array(points.length);
		var maxDist, maxLoc, temp, first, last, current;
		var i, encodedPoints, encodedLevels;
		var segmentLength;
		if(points.length > 2) {
			stack.push([0, points.length-1]);
			while(stack.length > 0) {
				current = stack.pop();
				maxDist = 0;
				segmentLength = Math.pow(points[current[1]].lat()-points[current[0]].lat(),2) +
					Math.pow(points[current[1]].lng()-points[current[0]].lng(),2);
				for(i = current[0]+1; i < current[1]; i++) {
					temp = this.distance(points[i],
						points[current[0]], points[current[1]],
						segmentLength);
					if(temp > maxDist) {
						maxDist = temp;
						maxLoc = i;
						if(maxDist > absMaxDist) {
							absMaxDist = maxDist;
						}
					}
				}
				if(maxDist > this.verySmall) {
					dists[maxLoc] = maxDist;
					stack.push([current[0], maxLoc]);
					stack.push([maxLoc, current[1]]);
				}
			}
		}
		encodedPoints = this.createEncodings(points, dists);
		encodedLevels = this.encodeLevels(points, dists, absMaxDist);
		return {
			encodedPoints: encodedPoints,
			encodedLevels: encodedLevels,
			encodedPointsLiteral: encodedPoints.replace(/\\/g,"\\\\")
		}
	}
	PolylineEncoder.prototype.dpEncodeToJSON = function(points,
		color, weight, opacity) {
		var result;
		if(!opacity) {
			opacity = 0.9;
		}
		if(!weight) {
			weight = 3;
		}
		if(!color) {
			color = "#0000ff";
		}
		result = this.dpEncode(points);
		return {
			color: color,
			weight: weight,
			opacity: opacity,
			points: result.encodedPoints,
			levels: result.encodedLevels,
			numLevels: this.numLevels,
			zoomFactor: this.zoomFactor
		}
	}
	PolylineEncoder.prototype.dpEncodeToGPolyline = function(points,
		color, weight, opacity) {
		if(!opacity) {
			opacity = 0.9;
		}
		if(!weight) {
			weight = 3;
		}
		if(!color) {
			color = "#0000ff";
		}
		return new GPolyline.fromEncoded(
			this.dpEncodeToJSON(points, color, weight, opacity));
	}
	PolylineEncoder.prototype.distance = function(p0, p1, p2, segLength) {
		var u, out;
		if(p1.lat() === p2.lat() && p1.lng() === p2.lng()) {
			out = Math.sqrt(Math.pow(p2.lat()-p0.lat(),2) + Math.pow(p2.lng()-p0.lng(),2));
		}
		else {
			u = ((p0.lat()-p1.lat())*(p2.lat()-p1.lat())+(p0.lng()-p1.lng())*(p2.lng()-p1.lng()))/
				segLength;

			if(u <= 0) {
				out = Math.sqrt(Math.pow(p0.lat() - p1.lat(),2) + Math.pow(p0.lng() - p1.lng(),2));
			}
			if(u >= 1) {
				out = Math.sqrt(Math.pow(p0.lat() - p2.lat(),2) + Math.pow(p0.lng() - p2.lng(),2));
			}
			if(0 < u && u < 1) {
				out = Math.sqrt(Math.pow(p0.lat()-p1.lat()-u*(p2.lat()-p1.lat()),2) +
					Math.pow(p0.lng()-p1.lng()-u*(p2.lng()-p1.lng()),2));
			}
		}
		return out;
	}
	PolylineEncoder.prototype.createEncodings = function(points, dists) {
		var i, dlat, dlng;
		var plat = 0;
		var plng = 0;
		var encoded_points = "";
		for(i = 0; i < points.length; i++) {
			if(dists[i] != undefined || i == 0 || i == points.length-1) {
				var point = points[i];
				var lat = point.lat();
				var lng = point.lng();
				var late5 = Math.floor(lat * 1e5);
				var lnge5 = Math.floor(lng * 1e5);
				dlat = late5 - plat;
				dlng = lnge5 - plng;
				plat = late5;
				plng = lnge5;
				encoded_points += this.encodeSignedNumber(dlat) +
					this.encodeSignedNumber(dlng);
			}
		}
		return encoded_points;
	}
	PolylineEncoder.prototype.computeLevel = function(dd) {
		var lev=0;
		if(dd > this.verySmall) {
			while(dd < this.zoomLevelBreaks[lev]) {
				lev++;
			}
		}
		return lev;
	}
	PolylineEncoder.prototype.encodeLevels = function(points, dists, absMaxDist) {
		var i;
		var encoded_levels = "";
		if(this.forceEndpoints) {
			encoded_levels += this.encodeNumber(this.numLevels-1)
		} else {
			encoded_levels += this.encodeNumber(
				this.numLevels-this.computeLevel(absMaxDist)-1)
		}
		for(i=1; i < points.length-1; i++) {
			if(dists[i] != undefined) {
				encoded_levels += this.encodeNumber(
					this.numLevels-this.computeLevel(dists[i])-1);
			}
		}
		if(this.forceEndpoints) {
			encoded_levels += this.encodeNumber(this.numLevels-1)
		} else {
			encoded_levels += this.encodeNumber(
				this.numLevels-this.computeLevel(absMaxDist)-1)
		}
		return encoded_levels;
	}
	PolylineEncoder.prototype.encodeNumber = function(num) {
		var encodeString = "";
		var nextValue, finalValue;
		while (num >= 0x20) {
			nextValue = (0x20 | (num & 0x1f)) + 63;
			encodeString += (String.fromCharCode(nextValue));
			num >>= 5;
		}
		finalValue = num + 63;
		encodeString += (String.fromCharCode(finalValue));
		return encodeString;
	}
	PolylineEncoder.prototype.encodeSignedNumber = function(num) {
		var sgn_num = num << 1;
		if (num < 0) {
			sgn_num = ~(sgn_num);
		}
		return(this.encodeNumber(sgn_num));
	}
	PolylineEncoder.latLng = function(y, x) {
					this.y = y;
					this.x = x;
	}
	PolylineEncoder.latLng.prototype.lat = function() {
					return this.y;
	}
	PolylineEncoder.latLng.prototype.lng = function() {
					return this.x;
	}
	PolylineEncoder.pointsToLatLngs = function(points) {
					var i, latLngs;
					latLngs = new Array(0);
					for(i=0; i<points.length; i++) {
									latLngs.push(new PolylineEncoder.latLng(points[i][0], points[i][1]));
					}
					return latLngs;
	}
	PolylineEncoder.pointsToGLatLngs = function(points) {
					var i, gLatLngs;
					gLatLngs = new Array(0);
					for(i=0; i<points.length; i++) {
									gLatLngs.push(new GLatLng(points[i][0], points[i][1]));
					}
					return gLatLngs;
	}  //  PolylineEncoder

	return { 
		addViewer: function addViewer( key, url, opts ) {
			var id, map_type = 'G_PHYSICAL_MAP', map_types; 

			if ( typeof opts !== 'object' ) {
				opts = {};
			}
			viewer_index += 1;

			// Conditionally load dependencies
			if ( typeof google !== 'object' || typeof google.maps !== 'object' ) {
				document.write('<' + 'script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key='+key+'" type="text/javascript"><' + '/script>');
			}

			// Options
			if ( opts.id ) {
				id = opts.id;
			} else {
				id = 'gpxviewer_' + viewer_index;
			}
			if ( opts.mapType ) {
				map_type = opts.mapType;
			}

			// If the markup doesn't exist yet, supply the default viewer markup
			if ( ! document.getElementById( id ) ) {
				document.write( '<div id="'+id+'" style="width:500px;height:500px;float:left"></div>' );
				document.write( '<div style="float:left;padding-left:20px">' );
				document.write( '<div id="'+id+'_hp" class="no_x" style="width:500px;height:200px;margin-top:10px"></div>' );
				document.write( '<div id="'+id+'_sp" class="no_x" style="width:500px;height:200px;margin-top:-37px"></div>' );
				document.write( '<div id="'+id+'_vp" style="width:500px;height:200px;margin-top:-37px"></div></div>' );
			}

			addEvent( window, 'load', function() {
				var map = new makeMap( id ),
					map_types = {
					'G_NORMAL_MAP': G_NORMAL_MAP,
					'G_SATELLITE_MAP': G_SATELLITE_MAP,
					'G_HYBRID_MAP': G_HYBRID_MAP,
					'G_PHYSICAL_MAP': G_PHYSICAL_MAP,
					'OSM': 'osm_mapnik_map',
					'OSM_TAH': 'osm_tah_map', 
					'OSM_CYCLE': 'osm_cycle_map'
					};
				map.Spur( url, map_types[map_type] );
				if ( viewer_index === 1 ) {
					addEvent(window,"unload",GUnload);
				}
			} );
		}
	};

})(); // GPX2GM
