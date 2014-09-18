/// <reference path="../../Ext-2.2/adapter/ext/ext-base.js" />
/// <reference path="../../Ext-2.2/ext-all-debug.js" />

Ext.namespace('FGI', 'FGI.openlayers');

/**
* @requires OpenLayers/Control.js
* @requires OpenLayers/Control/SelectFeature.js
* @requires OpenLayers/Feature/Vector.js
* @requires OpenLayers/Handler/Feature.js
*/

/**
* Class: FGI.openlayers.ClickAndHighlightFeature
* Selects vector features from a given layer on click AND on hover. 
*
* Inherits from:
*  - <OpenLayers.Control.SelectFeature>
*/
FGI.openlayers.ClickAndHighlightFeature = OpenLayers.Class(OpenLayers.Control.SelectFeature, {

    // default render style if none is specified
    renderIntent: "select",

    /**
    * {String} The name of the feature.data.["field"] to use as text for the tip.
    */
    hoverTipFieldName: '',

    /**
    * {Object}.x,{Object}.y  number of pixels to offset the tip
    */
    tipOffset: {
        x: 10, y: -30
    },

    /**
    * {Boolean} Shows a tip when hovering over a feature. Default is false.
    */
    showTip: false,


    /**
    * {String} The name of the feature.data.["field"] to use as the id to a unique feature.
    */
    featureIdField: '',

    /**
    * {Boolean} Zooms the map to the feature on click.  Default is false.
    */
    zoomOnClick: false,

    /**
    * {Boolean} Maintains the selected feature across layer refreshes.  Default is false.
    */
    preserveSelectedFeature: false,

    /**
    * {Boolean} Highlights feature on mouse over.  Default is true.
    */
    highlightOnMouseOver: true,

    /**
    * {Boolean} If true tooltip text will be wrapped in a <span> with the dir attribute set to 'rtl'.  Default is false.
    */
    displayRightToLeft: false,



    initialize: function(layer, options) {

        //force hover to be true always
        this.hover = true;

        // Ext.Tip object for showing feature name, etc...
        this.hoverTip = new Ext.Tip({ 
            closable: false,
            minWidth: 200
        });

        // add the control to the layer
        if (!layer.controls) {
            layer.controls = [];
        }
        layer.controls.push(this);

        //        if (this.preserveSelectedFeature) {
        //            layer.events.register("featureadded", this, this.selectSelectedFeature);
        //        }

        // if user passes in a clickFeature function, then append it to the existing funciton
        if (options.clickFeature) {
            //options.clickFeature = this.clickFeature.createSequence(options.clickFeature);
            options.clickFeature = Ext.Function.createSequence(this.clickFeature, options.clickFeature);
        }
        if (!options.featureIdField) {
            this.featureIdField = options.featureIdField;
        }

        OpenLayers.Control.SelectFeature.prototype.initialize.call(this, layer, options);

        // this passes through the mouseDown event to the map, 
        // so a user can pan the map while hovering over a polygon feature
        this.handlers.feature.stopDown = false;

    },


    // override the original clickFeature so that we can hover and click
    clickFeature: function(feature) {

        // zoom if desired
        if (this.zoomOnClick) {
            this.map.zoomToExtent(feature.geometry.bounds);
        }

        // determine if this feature is already in the selectedFeatures list
        var selected = (OpenLayers.Util.indexOf(this.layer.selectedFeatures, feature) > -1);
        if (selected) {
            if (this.toggleSelect()) {
                this.unselect(feature);
            } else if (!this.multipleSelect()) {
                this.unselectAll({ except: feature });
            }
        } else {
            if (!this.multipleSelect()) {
                this.unselectAll({ except: feature });
            }

            this.select(feature);
            //this.selectedFeatureToMaintain
        }

        // trigger the envent
        this.map.events.triggerEvent("featureclicked", feature);

        // hide the hover tip
        this.hoverTip.hide();

    },

    /**
    * Method: overFeature
    * Called on over a feature.
    * shows the tip
    *
    * Parameters:
    * feature - {<OpenLayers.Feature.Vector>} 
    */
    overFeature: function(feature) {
        if (this.showTip) {
            var postition = this.map.getPixelFromLonLat(feature.geometry.getBounds().getCenterLonLat());
            var clientBounds = this.map.div.getBoundingClientRect();
            var x = postition.x + clientBounds.left + this.tipOffset.x;
            var y = postition.y + clientBounds.top + this.tipOffset.y;
            if (this.displayRightToLeft) {
                this.hoverTip.setTitle("<span dir='rtl'>" + feature.data[this.hoverTipFieldName] + "</span>");
            } else {
                this.hoverTip.setTitle(feature.data[this.hoverTipFieldName]);
            }
            this.hoverTip.setPosition(x, y);
            this.hoverTip.show();
        }

        if (this.highlightOnMouseOver) {
            this.layer.drawFeature(feature, "temporary");
        }
    },


    // hides the tip and re-renders the feature based on it's selection status
    outFeature: function(feature) {
        if (this.showTip) {
            this.hoverTip.hide();
        }

        // determine if this feature is already in the selectedFeatures list
        var selected = (OpenLayers.Util.indexOf(this.layer.selectedFeatures, feature) > -1);
        if (selected) {
            this.layer.drawFeature(feature, "select");
        } else {
            this.layer.drawFeature(feature, "default");
        }
    },

    // unhighlight all features and re-render the features based on their selection status
    unhighlightAll: function() {
        for (var i in this.layer.features) {
            this.outFeature(this.layer.features[i]);
        }
    },

    // acts as if the user hovered over the feature with the given id
    highlightFeatureById: function(id) {
        this.overFeature(this.getFeatureById(id));
    },

    // acts as if the user clicked on the feature with the given id
    selectFeatureById: function(id) {
        this.clickFeature(this.getFeatureById(id));
    },

    // gets a feature given an Id 
    getFeatureById: function(id) {
        for (var i in this.layer.features) {
            if (this.layer.features[i].data != undefined) {
                if (this.layer.features[i].data[this.featureIdField] == id) {
                    return this.layer.features[i];
                }
            }
        }
    },

    CLASS_NAME: "OpenLayers.Control.ClickAndHighlightFeature"
});