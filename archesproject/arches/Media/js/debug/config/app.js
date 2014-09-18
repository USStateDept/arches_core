Ext.namespace('Arches.config.App');
Arches.config.App = {
	defaultFeatureLayer: {
        style:{
            default:{
                fillColor: "#008040",
                fillOpacity: 0.5,
                strokeColor: "#ee9900",
                strokeOpacity: .7,
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
	mapConfig: {
        maxExtent: new OpenLayers.Bounds(-200000, -200000, 200000, 200000),
        center: new OpenLayers.LonLat(-224149.03751366, 6978966.6705368),
        zoom: 6,
        numZoomLevels: 19,
        minZoomLevel: 1,
        fallThrough: false,
        controls: [new OpenLayers.Control.Navigation(), new OpenLayers.Control.Zoom()],
        displayProjection: new OpenLayers.Projection("EPSG:4326"),
        theme: null
    },
	default_language: 'en-us',
	primaryNameInfo:{
        "category": "label", 
        "language": "en-us", 
        "datatype": "text", 
        "value": "Primary", 
        "type": "prefLabel", 
        "id": "840f998b-3f46-11e4-a834-17fc93fa7620"
},
	arches_version:'.6127ba016596'
};