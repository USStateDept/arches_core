Ext.namespace('Arches.config.App');
Arches.config.App = {
	default_language: 'en-us',
	mapConfig: {
        maxExtent: new OpenLayers.Bounds(-200000, -200000, 200000, 200000),
        center: new OpenLayers.LonLat(-224149.03751366, 6978966.6705368),
        zoom: 2,
        numZoomLevels: 19,
        minZoomLevel: 1,
        fallThrough: false,
        controls: [new OpenLayers.Control.Navigation(), new OpenLayers.Control.Zoom()],
        displayProjection: new OpenLayers.Projection("EPSG:4326"),
        theme: null
    },
	defaultFeatureLayer: {
        style:{
            default:{
                fillColor: "#008040",
                fillOpacity: 0.8,
                strokeColor: "#ee9900",
                strokeOpacity: .9,
                strokeWidth: 1,
                pointRadius: 8
            },
            select: {
                fillColor: "#66ccff",
                strokeColor: "#3399ff",
                graphicZIndex: 2
            }
        }
    },
	primaryNameInfo:{
        "category": "label", 
        "language": "en-us", 
        "datatype": "text", 
        "value": "Primary", 
        "type": "prefLabel", 
        "id": "8e681e3e-1bec-11e4-9bfc-fb2fe5083efc"
},
	arches_version:'.6127ba016596'
};