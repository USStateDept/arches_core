/// <reference path="../../Ext-2.2/adapter/ext/ext-base.js" />
/// <reference path="../../Ext-2.2/ext-all-debug.js" />

Ext.namespace('FGI', 'FGI.openlayers');


/**
 * @requires OpenLayers/Tile/WFS.js
 * @requires OpenLayers/Layer/Vector.js
 * @requires OpenLayers/Layer/Markers.js
 */


/**
 * Class: OpenLayers.Layer.WFS
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.WFS>
 */
FGI.openlayers.SmartWFS = OpenLayers.Class(OpenLayers.Layer.WFS, {

    // a flag used to override the BBOX calculated in the moveTo function
    // in favor of the tempBBOX parameter
    overrideBBOX: false,

    tempBBOX: null,

    // a flag to let us know that the data is being clustered and that we will 
    // force a request for data every time the "moveTo" method is called
    isClustered: false,

    // true if layer visibility should not be auto managed
    manualMode: false,
    manualModeStyleMap: null,

    forceVisible: false,
    forceHidden: false,

    visibleZoomRange: {
        min: 0,
        max: 19
    },

    setManualMode: function (mode) {
        this.manualMode = mode;
    },

    /** 
    * Method: moveTo
    * 
    * Parameters:
    * bounds - {<OpenLayers.Bounds>} 
    * zoomChanged - {Boolean} 
    * dragging - {Boolean} 
    */
    moveTo: function (bounds, zoomChanged, dragging) {
        if (this.vectorMode) {
            OpenLayers.Layer.Vector.prototype.moveTo.apply(this, arguments);
        } else {
            OpenLayers.Layer.Markers.prototype.moveTo.apply(this, arguments);
        }

        // don't load wfs features while dragging, wait for drag end
        if (dragging) {
            // TBD try to hide the vector layer while dragging
            // this.setVisibility(false);
            // this will probably help for panning performances
            return false;
        }

        // don't load wfs features if outside the visible range
        if ((this.map.zoom < this.visibleZoomRangeTemp.min || this.map.zoom > this.visibleZoomRangeTemp.max) && this.manualMode == false) {
            return;
        }

        // Commented by ANP - don't clear the layer of it's features 
        // until we know we are going to query for more
        //        if ( zoomChanged ) {
        //            if (this.vectorMode) {
        //                this.renderer.clear();
        //            }
        //        }

        //DEPRECATED - REMOVE IN 3.0
        // don't load data if current zoom level doesn't match
        if (this.options.minZoomLevel) {
            OpenLayers.Console.warn(OpenLayers.i18n('minZoomLevelError'));

            if (this.map.getZoom() < this.options.minZoomLevel) {
                return null;
            }
        }

        // Added by ANP
        if (this.overrideBBOX) {
            bounds = this.tempBBOX;
        }
        if (bounds === null) {
            bounds = this.map.getExtent();
        }

        var firstRendering = (this.tile === null);

        //does the new bounds to which we need to move fall outside of the 
        // current tile's bounds?
        var outOfBounds = (!firstRendering &&
                           !this.tile.bounds.containsBounds(bounds));

        // Added by ANP
        // Flag to let us know if we've loaded the maximum number of features into our layer
        // meaning that there may be more and we'll need to requery the db
        var hitFeatureLimit = (this.params.maxfeatures <= this.features.length);

        // if Clustering data then we need to make some exceptions in how we normally retrieve data
        // setting hitFeatureLimit to false ensures that even if we've returned less then maxfeatures that we still try and retrieve data
        // setting outOfBounds to true if zooming ensures that if we always get data on a zoom
        // The only time we don't get data is if we pan but are still within bounds (bounds = map extent * ratio)
        if (this.isClustered) {
            hitFeatureLimit = false;
            if (zoomChanged) {
                outOfBounds = true;
            }
        }

        // Get data from the server
        if (hitFeatureLimit || firstRendering || (!dragging && outOfBounds)) {
            //determine new tile bounds
            var center = bounds.getCenterLonLat();
            var tileWidth = bounds.getWidth() * this.ratio;
            var tileHeight = bounds.getHeight() * this.ratio;
            var tileBounds =
                new OpenLayers.Bounds(center.lon - (tileWidth / 2),
                                      center.lat - (tileHeight / 2),
                                      center.lon + (tileWidth / 2),
                                      center.lat + (tileHeight / 2));

            //determine new tile size
            var tileSize = this.map.getSize();
            tileSize.w = tileSize.w * this.ratio;
            tileSize.h = tileSize.h * this.ratio;

            //determine new position (upper left corner of new bounds)
            var ul = new OpenLayers.LonLat(tileBounds.left, tileBounds.top);
            var pos = this.map.getLayerPxFromLonLat(ul);

            //formulate request url string
            var url = this.getFullRequestString();

            var params = { BBOX: this.encodeBBOX ? tileBounds.toBBOX() : tileBounds.toArray(),
                zoomLevel: this.map.getZoom()
            };

            if (this.map && !this.projection.equals(this.map.getProjectionObject())) {
                var projectedBounds = tileBounds.clone();
                projectedBounds.transform(this.map.getProjectionObject(),
                                          this.projection);
                params.BBOX = this.encodeBBOX ? projectedBounds.toBBOX()
                                              : projectedBounds.toArray();
            }

            url += "&" + OpenLayers.Util.getParameterString(params);

            // will draw features into its own layer unless renderToLayer is specified, 
            // then will draw the features into that layer
            var theLayer = this;
            if (this.renderToLayer) {
                theLayer = this.renderToLayer;
            }

            if (!this.tile) {
                this.tile = new OpenLayers.Tile.WFS(theLayer, pos, tileBounds,
                                                     url, tileSize);
                this.addTileMonitoringHooks(this.tile);
                this.tile.draw();
            } else {
                if (this.vectorMode) {
                    this.destroyFeatures();
                    this.renderer.clear();
                } else {
                    this.clearMarkers();
                }
                this.removeTileMonitoringHooks(this.tile);
                this.tile.destroy();

                this.tile = null;
                this.tile = new OpenLayers.Tile.WFS(theLayer, pos, tileBounds,
                                                     url, tileSize);
                this.addTileMonitoringHooks(this.tile);
                this.tile.draw();

                // if we want to preserve the selected feature do it here...maybe... or do it in the select control?
            }
        }
    },

    /**
    * APIMethod: drawFeature
    * Draw (or redraw) a feature on the layer.  If the optional style argument
    * is included, this style will be used.  If no style is included, the
    * feature's style will be used.  If the feature doesn't have a style,
    * the layer's style will be used.
    * 
    * Parameters: 
    * feature - {<OpenLayers.Feature.Vector>} 
    * style - {Object} Symbolizer hash or {String} renderIntent
    */
    drawFeature: function (feature, style) {
        if (typeof style != "object") {
            var renderIntent = typeof style == "string" ?
                style : feature.renderIntent;
            style = feature.style || this.style;
            if (!style) {
                style = this.styleMap.createSymbolizer(feature, renderIntent);
            }
        }

        switch (feature.geometry.CLASS_NAME) {
            case 'OpenLayers.Geometry.MultiPolygon':
            case 'OpenLayers.Geometry.Polygon':
                if (feature.geometry.getArea() < 1) {
                    style.strokeWidth = 10;
                }
                break;
            //            case 'OpenLayers.Geometry.MultiLineString':                   
            //            case 'OpenLayers.Geometry.LineString':                   
            //                //delete style.fillColor;                   
            //                break;                   
            //            case 'OpenLayers.Geometry.MultiPoint':                   
            //            case 'OpenLayers.Geometry.Point':                   
            //                //delete style.fillColor;                   
            //                break;                   
        }

        if (!this.renderer.drawFeature(feature, style)) {
            this.unrenderedFeatures[feature.id] = feature;
        } else {
            delete this.unrenderedFeatures[feature.id];
        }
    },


    /**
    * APIMethod: getFeatureByIdField
    * Try to find the feature given the field id value
    * Uses the field name specified in featureIdFieldName as the key
    * 
    * Parameters: 
    * id - {<OpenLayers.Feature.Vector>} 
    */
    getFeatureByIdField: function (id) {
        // search through the visible features
        for (var i = this.features.length; i > 0; i--) {
            if (this.features[i - 1].data[this.featureIdFieldName] == id) {
                return this.features[i - 1];
            }
        }
    },

    /**
    * APIMethod: destroy
    */
    destroy: function () {
        // need to unregister the zoomend event before we remove the layer otherwise bad things happen
        if (this.map) {
            this.map.events.unregister('zoomend', this, this.resetVisibility);
        }

        OpenLayers.Layer.WFS.prototype.destroy.apply(this, arguments);
    },

    /**
    * Method: setMap
    * 
    * Parameters:
    * map - {<OpenLayers.Map>} 
    */
    setMap: function (map) {
        OpenLayers.Layer.WFS.prototype.setMap.apply(this, arguments);

        // had to create the regular function 'restoreVisiblity' because if we register an
        // anonymous function we can't unregister it later
        this.map.events.register('zoomend', this, this.resetVisibility);
    },

    // used simply for registering the zoomend event
    resetVisibility: function () {
        this.setVisibility(false, true);
    },

    /** 
    * APIMethod: setVisibility
    * Set the visibility flag for the layer and hide/show & redraw 
    *     accordingly. Fire event unless otherwise specified
    * 
    * Note that visibility is no longer simply whether or not the layer's
    *     style.display is set to "block". Now we store a 'visibility' state 
    *     property on the layer class, this allows us to remember whether or 
    *     not we *desire* for a layer to be visible. In the case where the 
    *     map's resolution is out of the layer's range, this desire may be 
    *     subverted.
    * 
    * Parameters:
    * visible - {Boolean} Whether or not to display the layer (if in range)
    */
    setVisibility: function (visibility, autoManage) {
        if (autoManage == true) {
            if (this.manualMode == true) {
                return;
            }

            if (this.forceHidden) {
                visibility = false;

                // if you're outside the bounds of the viewable range then
                // reset forceHidden to false to allow the layer to be viewed normally 
                if (this.map.zoom <= this.visibleZoomRangeTemp.min ||
                this.map.zoom >= this.visibleZoomRangeTemp.max) {
                    this.forceHidden = false;
                    this.forceVisible = false;
                }

            } else if (this.forceVisible) {
                // adjust the visiblity of the layer temporarily
                if (this.map.zoom < this.visibleZoomRange.min) {
                    this.visibleZoomRangeTemp.min = this.map.zoom;
                } else if (this.map.zoom > this.visibleZoomRange.max) {
                    this.visibleZoomRangeTemp.max = this.map.zoom;
                }
                // reset the flag, this is only set to true to override the defaults
                this.forceVisible = false;
                visibility = true;
            } else {
                // if within the temporary zoom limits, show the layer
                // else, turn off the layer, and reset the limits back to normal
                if (this.map.zoom >= this.visibleZoomRangeTemp.min &&
                        this.map.zoom <= this.visibleZoomRangeTemp.max) {
                    visibility = true;
                } else {
                    visibility = false;
                    this.visibleZoomRangeTemp.min = this.visibleZoomRange.min;
                    this.visibleZoomRangeTemp.max = this.visibleZoomRange.max;
                }
            }
        }

        OpenLayers.Layer.WFS.prototype.setVisibility.apply(this, arguments);
    },

    /**
    * Constructor: FGI.openlayers.SmartWFS 
    *
    * Parameters:
    * name - {String} 
    * url - {String} 
    * params - {Object} 
    * options - {Object} Hashtable of extra options to tag onto the layer
    */
    initialize: function (name, url, params, options) {
        OpenLayers.Layer.WFS.prototype.initialize.apply(this, arguments);

        this.visibleZoomRangeTemp = {
            min: this.visibleZoomRange.min,
            max: this.visibleZoomRange.max
        };
    }

});