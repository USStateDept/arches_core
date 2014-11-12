/*
ARCHES - a program developed to inventory and manage immovable cultural heritage.
Copyright (C) 2013 J. Paul Getty Trust and World Monuments Fund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
    defaultHandlerOptions: {
        'single': true,
        'double': false,
        'pixelTolerance': 0,
        'stopSingle': false,
        'stopDouble': false
    },

    initialize: function(options) {
        this.handlerOptions = OpenLayers.Util.extend(
            {}, this.defaultHandlerOptions
        );
        OpenLayers.Control.prototype.initialize.apply(
            this, arguments
        );
        this.handler = new OpenLayers.Handler.Click(
            this, {
                'click': this.trigger
            }, this.handlerOptions
        );
    },

    trigger: function(e) {
        return;
    }

});

OpenLayers.Format.ArchesEntityJSON = OpenLayers.Class(OpenLayers.Format.JSON,{
     read: function (responseText) {
        var json = Ext.decode(responseText);
        var reader = new OpenLayers.Format.WKT({
            'internalProjection': new OpenLayers.Projection("EPSG:900913"),
            'externalProjection': new OpenLayers.Projection("EPSG:4326")
        });
        var features = [],
            handleGeomCollection = function(geometryCollectionFeature, index, allItems){
                geometryCollectionFeature.attributes = item;
                features.push(geometryCollectionFeature);
            };
        if(json.hits){
            for (var i = 0; i < json.hits.hits.length; i++) {
                var item = json.hits.hits[i]._source;
                var feature = reader.read(item.geometry);
                if(feature.length){
                    // handle for geometry collection
                    Ext.each(feature, handleGeomCollection);
                }else{
                    feature.attributes = item;
                    features.push(feature);
                }
            }
        }
        return features;
    },

    CLASS_NAME: "OpenLayers.Format.ArchesEntityJSON"
});

OpenLayers.ArchesResourceStyle = OpenLayers.Class(OpenLayers.Style, {
    initialize: function (color, styleConfig, contextConfig) {
        styleConfig = Ext.apply({
            cursor: "pointer",
            strokeColor: color,
            fillColor: color,
            strokeOpacity: "${getStrokeOpacity}",
            fillOpacity: ".25",
            pointRadius: "${getRadius}",
            strokeWidth: "${getStrokeWidth}",
            labelOutlineWidth: 1,
            fontColor: "#ffffff",
            fontOpacity: 1,
            fontSize: "12px",
            fontWeight:"bold",
            label: "${getLabel}",
            graphicZIndex: "${getZIndex}"
        }, styleConfig);

        contextConfig = Ext.apply({
            clusterStrokeWidth: 12,
            regularStrokeWidth: 2,
            clusterStrokeOpacity: 0.5,
            regularStrokeOpacity: 0.8,
            clusterFillOpacity: 0.9,
            regularFillOpacity: 0.5
        }, contextConfig);

        var options = {
            context: {
                getZIndex: function (feature) {
                    var zIndex = 0;
                    if (feature.geometry.CLASS_NAME === "OpenLayers.Geometry.Point"){
                        zIndex = 1;
                    } else if (feature.geometry.CLASS_NAME === "OpenLayers.Geometry.Polygon"){
                        zIndex = feature.geometry.getArea() * -1;
                    }
                    return zIndex;
                },
                getStrokeWidth: function(feature) {
                    return (feature.cluster) ? contextConfig.clusterStrokeWidth : contextConfig.regularStrokeWidth;
                },
                getStrokeOpacity: function (feature) {
                    return (feature.cluster) ? contextConfig.clusterStrokeOpacity : contextConfig.regularStrokeOpacity;
                },
                getFillOpacity: function (feature) {
                    return (feature.cluster) ? contextConfig.clusterFillOpacity : contextConfig.regularFillOpacity;
                },
                getLabel: function (feature) {
                    var label = "";
                    if (feature.cluster) {
                        var resourceIds = [];
                        Ext.each(feature.cluster, function(feature) {
                            Ext.Array.include(resourceIds,feature.attributes.entityid);
                        });
                        label = resourceIds.length;
                    }
                    return label;
                },
                getRadius: function(feature) {
                    var pix = 6;
                    if(feature.cluster) {
                        if (feature.attributes.count > 50){
                            pix = 20;
                        } else if (feature.attributes.count > 15) {
                            pix = 15;
                        } else {
                            pix = 10;
                        }
                    }
                    return pix;
                }
            }
        };


        OpenLayers.Style.prototype.initialize.apply(this, [
            styleConfig,
            options
        ]);
    },

    CLASS_NAME: "OpenLayers.ArchesResourceStyle"
});

OpenLayers.Layer.ArchesResourceCluster = OpenLayers.Class(OpenLayers.Layer.Vector, {
    initialize: function(entitytypeid, color, options) {
        var clusterStrategy = new OpenLayers.Strategy.Cluster({distance: 100, threshold: 3});
 
        options = Ext.apply({
            rendererOptions: {zIndexing: true},
            styleMap: new OpenLayers.StyleMap({
                "default": new OpenLayers.ArchesResourceStyle(color),
                "temporary": new OpenLayers.ArchesResourceStyle(color, {
                    fontSize: '14px'
                },{
                    clusterStrokeWidth: 14,
                    regularStrokeWidth: 4,
                    clusterStrokeOpacity: 0.7,
                    regularStrokeOpacity: 0.9,
                    clusterFillOpacity: 1,
                    regularFillOpacity: 0.7
                })
            }),
            strategies: [
                new OpenLayers.Strategy.BBOX(),
                clusterStrategy
            ],
            protocol: new OpenLayers.Protocol.HTTP({
                url: Arches.config.Urls.mapLayers + '/' + entitytypeid,
                visibility: true,
                format: new OpenLayers.Format.ArchesEntityJSON()
            })
        }, options);

        OpenLayers.Layer.Vector.prototype.initialize.apply(this, [
            entitytypeid,
            options
        ]);

        var setClustering = function() {
            var map = clusterStrategy.layer.map;
            if (map.getZoom() >= (map.numZoomLevels-3)) {
                if (clusterStrategy.active) {
                    clusterStrategy.deactivate();
                }
            } else if (!clusterStrategy.active) {
                clusterStrategy.activate();
            }
        };

        this.events.on({
            "moveend": function(event) {
                if (event.zoomChanged) {
                    setClustering();
                }
            },
            "featuresadded": setClustering
        });
    },

    CLASS_NAME: "OpenLayers.Layer.ArchesResourceCluster"
});

OpenLayers.Util.onImageLoadErrorColor = 'transparent';

Ext.define('Arches.widgets.MapPanel', {
    extend: 'FGI.widgets.MapPanel',
    alias: 'widgets.arches-widgets-mappanel',

    i18n: {
        currentZoomLevelLabel: 'Current Zoom Level:',
        cursorPositionLabel: 'Cursor Position:'
    },

    id: 'map-panel',
    region: 'center',
    border: false,
    style: 'border-left: 6px solid #616161;',
    selectableLayers: [],
    infoBarOffsets: [6, 0],

    initComponent: function () {
        this.addEvents({
            'layerAdded': true,
            'layerRemoved': true
        });

        this.map = new OpenLayers.Map('map', Arches.config.App.mapConfig);

        var click = new OpenLayers.Control.Click({'trigger':this.collapseSearchSuggestions});
        this.map.addControl(click);
        click.activate();

        this.infoBar = Ext.create('Ext.container.Container', {
            floating: true,
            cls: 'map-infobar',
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            autoShow: true,
            border: false,
            items: [
                Ext.create('Ext.container.Container', {
                    width: 200,
                    style: 'padding:5px;',
                    html: '<span style="padding-left:10px;font-size:14px;">' + this.i18n.currentZoomLevelLabel + ' <span id="zoom-level" style="padding-right:20px">0</span></span>'
                }),
                Ext.create('Ext.container.Container', {
                    flex: 1,
                    style: 'padding:5px;',
                    html: '<span style="padding-left:15px;font-size:14px;">' + this.i18n.cursorPositionLabel + ' <span id="cursor-position"></span></span>'
                }),
                Ext.create('Ext.Component', {
                    html: '<div id="scale-area" style="float:right; padding-right: 15px;"></div>',
                    width: 200
                })
            ],
            height: 40
        });
        this.infoBar.hide();

        this.callParent(arguments);

        this.selectPopup = Ext.create('Arches.widgets.Popup', {
            map: this.map,
            contentTpl: new Ext.XTemplate(Arches.config.Tpls.searchItem, Arches.config.Tpls.functions),
            ui: 'fgi_panel_gray',
            height: 75,
            width: 260,
            offset: {
                x: 0,
                y: 0
            },
            listeners: {
                'hide': function () {
                    this.selectControl.unselectAll();
                    this.selectPopup.feature = null;
                },
                'click': function(popup, e, extEl){
                    if (extEl.dom.className === 'view-report') {
                        this.fireEvent('showreportclicked', popup.feature.attributes.entitytypeid, popup.feature.attributes.entityid);
                        this.selectPopup.hide();
                    } else if (extEl.dom.className === 'edit-entity') {
                        this.fireEvent('editentityclicked', popup.feature.attributes.entityid);
                        this.selectPopup.hide();
                    } else if (extEl.dom.className === 'zoom-to-entity') {
                        this.map.zoomToExtent(popup.feature.geometry.getBounds());
                    }
                },
                scope: this
            }
        });

        this.clusterPopup = Ext.create('Arches.widgets.Popup', {
            map: this.map,
            contentTpl: new Ext.XTemplate(Arches.config.Tpls.clusterPopup, Arches.config.Tpls.functions),
            ui: 'fgi_panel_gray',
            layout: 'card',
            height: 75,
            width: 260,
            offset: {
                x: 0,
                y: 0
            },
            listeners: {
                'show': function () {
                    this.clusterPopup.layout.setActiveItem(this.clusterPopup.contentPanel);
                    this.clusterPopup.setSize(260, 75);
                },
                'hide': function () {
                    this.selectControl.unselectAll();
                    this.clusterPopup.feature = null;
                },
                'click': function(popup, e, extEl){
                    if (extEl.dom.className === 'list-features') {
                        this.clusterPopup.layout.setActiveItem(this.clusterPopup.listPanel);
                        this.clusterPopup.setSize(260, 300);
                    }
                },
                'featureset': function(feature) {
                    this.clusterPopup.listPanel.setFeature(feature);
                },
                scope: this
            }
        });

        this.clusterPopup.listPanel = Ext.create('Arches.widgets.ClusterList', {
                listeners: {
                'itemclick': function (view, record, item, index, e) {
                    if (Ext.get(e.getTarget('.view-report'))) {
                        this.fireEvent('showreportclicked', record.get('entityTypeId'), record.get('entityId'));
                    } else if (Ext.get(e.getTarget('.edit-entity'))) {
                        this.fireEvent('editentityclicked', record.get('entityId'));
                        this.clusterPopup.hide();
                    } else if (Ext.get(e.getTarget('.zoom-to-entity'))) {
                        var geom = record.get('geometry');
                        this.map.zoomToExtent(geom.getBounds());
                    }
                },
                scope: this
            }
        });

        this.clusterPopup.add(this.clusterPopup.listPanel);

        this.hoverPopup = Ext.create('Arches.widgets.Popup', {
            map: this.map,
            contentTpl: new Ext.XTemplate(Arches.config.Tpls.searchItem, Arches.config.Tpls.functions),
            ui: 'fgi_panel_gray',
            height: 75,
            width: 260,
            offset: {
                x: 0,
                y: 0
            },
            listeners: {
                'hide': function () {
                    //this.selectControl.unselectAll();
                    this.hoverPopup.feature = null;
                },
                'click': function(popup, e, extEl){
                    if (extEl.dom.className === 'view-report') {
                        this.fireEvent('showreportclicked', popup.feature.attributes.entitytypeid, popup.feature.attributes.entityid);
                        this.hoverPopup.hide();
                    } else if (extEl.dom.className === 'edit-entity') {
                        this.fireEvent('editentityclicked', popup.feature.attributes.entityid);
                        this.hoverPopup.hide();
                    } else if (extEl.dom.className === 'zoom-to-entity') {
                        this.map.zoomToExtent(popup.feature.geometry.getBounds());
                    }
                },
                scope: this
            }
        });

        if (this.baseLayer){
            this.map.addLayer(this.baseLayer);
        }

        var clusterHullStyle = new OpenLayers.StyleMap({
            "default": new OpenLayers.Style({
                strokeWidth: 2,
                strokeOpacity: 0.9,
                strokeColor: '#808080',
                fillOpacity: 0.4,
                fillColor: '#808080'
            })
        });

        this.clusterHullLayer = new OpenLayers.Layer.Vector("Cluster Hulls", {
            styleMap: clusterHullStyle
        });

        this.map.addLayer(this.clusterHullLayer);

        var searchResultsStyleDefaults = {
            externalGraphic: "${icon}",
            backgroundGraphic: Arches.config.Urls.mediaPath + "images/map_icons/shadow.png"
        };                

        var searchResultsStyle = new OpenLayers.StyleMap({
            "default": new OpenLayers.Style(Ext.apply({
                graphicWidth: 24,
                graphicHeight: 27,
                graphicOpacity: 1,
                graphicXOffset: -12,
                graphicYOffset: -27,
                graphicZIndex: 1,
                backgroundXOffset: -12,
                backgroundYOffset: -27,
                backgroundGraphicZIndex: 0,
                backgroundHeight: 27,
                backgroundWidth: 38
            }, searchResultsStyleDefaults)),
            "temporary": new OpenLayers.Style(Ext.apply({
                graphicWidth: 32,
                graphicHeight: 37,
                graphicOpacity: 1,
                graphicXOffset: -16,
                graphicYOffset: -37,
                graphicZIndex: 2,
                backgroundXOffset: -16,
                backgroundYOffset: -37,
                backgroundGraphicZIndex: 0,
                backgroundHeight: 37,
                backgroundWidth: 48
            }, searchResultsStyleDefaults))
        });

        this.searchResultsLayer = new OpenLayers.Layer.Vector("Search Results", {
            styleMap: searchResultsStyle,
            rendererOptions: {zIndexing: true}
        });

        this.selectableLayers.push(this.searchResultsLayer);

        this.map.addLayer(this.searchResultsLayer);

        this.mousePosition = new OpenLayers.Control.MousePosition({
            element: Ext.get('cursor-position').dom
        });

        this.map.addControl(this.mousePosition);

        this.map.addControl(new OpenLayers.Control.ScaleBar({
            div: Ext.get('scale-area').dom,
            singleLine: true,
            abbreviateLabel: true
        }));

        this.map.events.register("zoomend", this, function (event) {
            this.clusterHullLayer.removeAllFeatures();
            var zoom = this.map.getZoom();
            Ext.get('zoom-level').dom.innerHTML = zoom;
            this.doLayout();
        });

        this.highlightControl = new OpenLayers.Control.SelectFeature(this.selectableLayers, {
            hover: true,
            highlightOnly: true,
            renderIntent: "temporary",
            eventListeners: {
                featurehighlighted: this.featureOver,
                featureunhighlighted: this.featureOut,
                scope: this
            }
        });

        this.selectControl = new OpenLayers.Control.SelectFeature(this.selectableLayers, { 
            clickout: true,      
            renderIntent: "default",
            onSelect: this.featureSelected,
            onUnselect: this.featureUnselected,
            scope: this,
            toggle: true 
        });

        this.selectControl.handlers.feature.stopDown = false; 
        this.highlightControl.handlers.feature.stopDown = false;

        this.map.addControl(this.highlightControl);
        this.map.addControl(this.selectControl);

        this.highlightControl.activate();
        this.selectControl.activate();

        if (Arches.config.App.mapConfig.zoom){
            this.map.zoomTo(Arches.config.App.mapConfig.zoom);
        }
    },

    getWidthForInfoBar: function () {
        return this.getWidth()-6;
    },

    collapseSearchSuggestions: function(e){
        return;
    },

    setBaseLayer: function(layer) {
        if (this.baseLayer) {
            this.map.removeLayer(this.baseLayer);
        }
        this.map.addLayer(layer);
        this.map.setBaseLayer(layer);
        this.baseLayer = layer;
    },

    resetSelectControls: function () {
        this.highlightControl.setLayer(this.selectableLayers);
        this.selectControl.setLayer(this.selectableLayers);
    },
    
    addLayer:function (layerRecord) {
        layerRecord.get('layer').record = layerRecord;
        this.map.addLayer(layerRecord.get('layer'));
        this.map.setLayerIndex(this.searchResultsLayer, this.map.layers.length - 1);
        layerRecord.set('onMap', true);
        if (layerRecord.get('selectable')) {
            this.selectableLayers.push(layerRecord.get('layer'));
            this.resetSelectControls();
        }
        this.fireEvent('layerAdded', layerRecord);
    },

    removeLayer:function (layerRecord) {
        this.map.removeLayer(layerRecord.get('layer'));
        layerRecord.set('onMap', false);
        if (layerRecord.get('selectable')) {
            Ext.Array.remove(this.selectableLayers, layerRecord.get('layer'));
            this.resetSelectControls();
        }
        this.fireEvent('layerRemoved', layerRecord);
    },

    updateSearchResults: function (results) {
        var reader = new OpenLayers.Format.WKT({
                'internalProjection': new OpenLayers.Projection("EPSG:900913"),
                'externalProjection': new OpenLayers.Projection("EPSG:4326") 
            }),
            features = [],
            bounds; 
        this.searchResultsLayer.removeAllFeatures();
        Ext.each(results, function(resultModel) {
            var geom = resultModel.getGeometry();
            if (geom) {
                var feature = reader.read(geom);
                feature.geometry = feature.geometry.getCentroid();
                feature.attributes = resultModel.data;
                feature.attributes.entitytypeid = resultModel.data.entityTypeId;
                feature.attributes.entityid = resultModel.data.entityId;
                var icon = Arches.config.Tpls.functions.getPropertyValueFromEntityTypeId(resultModel.data.entityTypeId, 'icon');
                feature.attributes.icon = Arches.config.Urls.mediaPath + "images/AssetIcons/" + icon + "-map.png";
                features.push(feature);
                if (!bounds) {
                    bounds = feature.geometry.getBounds();
                } else {
                    bounds.extend(feature.geometry.getBounds());
                }
            }
        }, this);
        this.searchResultsLayer.addFeatures(features);
        if (bounds) {
            this.map.zoomToExtent(bounds);
        }
    },

    hideAllPopups: function () {
        this.selectPopup.hide();
        this.clusterPopup.hide();
        this.hoverPopup.hide();
    },

    setSearchResultRenderIntent: function (record, intent) {
        Ext.each(this.searchResultsLayer.features, function (feature) {
            if (record.get('entityId') === feature.attributes.entityId) {
                feature.renderIntent = intent;
                this.searchResultsLayer.redraw();
            }
        }, this);
    },   

    featureSelected: function (feature) {
        if (this.showClusterTask) {
            this.showClusterTask.cancel();
            this.showClusterTask = null;
        }    
        this.selectPopup.hide();
        if (feature.cluster) {
            this.map.zoomToExtent(feature.convexHull.geometry.getBounds());
            this.selectControl.unselectAll();
        } else {
            var xy = this.map.getControlsByClass('OpenLayers.Control.MousePosition')[0].lastXy; 
            this.selectPopup.setFeature(feature, this.map.getLonLatFromPixel(xy));
        }
        this.hoverPopup.hide();
    },

    featureUnselected: function (feature) {
        if (feature.cluster) {
            if (feature.cluster.length > 2) {
                this.clusterHullLayer.removeFeatures([feature.convexHull]);
            }
            this.clusterPopup.hide();
        } else {
            this.selectPopup.hide();
        }
    },

    featureOver: function (event) {
        if (event.feature.cluster) {
            if (event.feature.cluster.length > 2) {
                var color = event.feature.layer.styleMap.styles["default"].defaultStyle.fillColor;
                event.feature.convexHull = OpenLayers.Util.QuickHull(event.feature.cluster);
                event.feature.convexHull.style = {
                    strokeWidth: 2,
                    strokeOpacity: 0.9,
                    strokeColor: color,
                    fillOpacity: 0.4,
                    fillColor: color
                };
                this.clusterHullLayer.addFeatures([event.feature.convexHull]);
            }
            if (this.showClusterTask) {
                this.showClusterTask.cancel();
            }
            this.showClusterTask = new Ext.util.DelayedTask(function(){
                this.showClusterPopup(event.feature); 
            }, this);
            this.showClusterTask.delay(800);
        } else if (this.selectPopup.feature !== event.feature) {
            var xy = this.map.getControlsByClass('OpenLayers.Control.MousePosition')[0].lastXy;
            this.hoverPopup.setFeature(event.feature, this.map.getLonLatFromPixel(xy));     
        }

        if (event.feature.layer === this.searchResultsLayer) {
            this.fireEvent('searchresultover', this, event.feature);
        }
    },

    featureOut: function (event) { 
        if (this.showClusterTask) {
            this.showClusterTask.cancel();
            this.showClusterTask = null;
        }       
        this.hoverPopup.hide();
        this.clusterPopup.hide();
        if (event.feature.cluster && event.feature.cluster.length > 2) {
            this.clusterHullLayer.removeFeatures([event.feature.convexHull]);
        }
        if (event.feature.layer === this.searchResultsLayer) {
            this.fireEvent('searchresultout', this, event.feature);
        }
    },
    
    showClusterPopup: function (feature) {
        feature.attributes.icon = 'unknown';
        if (feature.layer.record.get('icon')) {
            feature.attributes.icon = feature.layer.record.get('icon')
        }
        feature.attributes.layerName = Arches.config.Tpls.functions.getEntityTypeNameFromId(feature.layer.name);
        var xy = this.map.getControlsByClass('OpenLayers.Control.MousePosition')[0].lastXy;
        this.clusterPopup.setFeature(feature, this.map.getLonLatFromPixel(xy));
    }
});