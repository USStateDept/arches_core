
/** 
* @class FGI.widgets.Legend
* @extends Ext.panel.Panel
* @requires Ext 4.0.0
* <p>the general philosophy is that the legned controls or can control the map
* and as its data repository it uses a Ext.data.Store</p>
*/
Ext.define('FGI.widgets.Legend', {
    extend: 'Ext.panel.Panel',
    alias: 'fgi-widgets-legend',

    config: {
        /**
        * @property OpenLayers.Map that the store is synchronized with.
        */
        map: null,

        /**
        * @property default template to use for rendering each Layer in the Legend
        */
        itemTemplate: '<tpl for=".">' +
                        '<div class="legend-item">' +
                            '<span class="remove" title="remove this layer">&nbsp;</span>' +
                            '<span class="{[values.layer.getVisibility() ? "row-checker checked" : "row-checker" ]}">&nbsp;</span>' +
                            '<span title="{[values.hasLabelLayer ? "click to show/hide the labels" : ""]}" class="{[values.hasLabelLayer ? (values.layer.labelVisibility ? "label" : "label off") : "label none"]}">&nbsp;</span>' +
                            '<span title="click to activate the layer" class="legend-name">{name}</span>' +
                            '<span class="more-less">more...</span>' +
                            '<div style="display:none" class="legend-item-metadata">' +
                            '<div>{description}</div>' +
                            '<img src="{legendImage}" />' +
                            '</div>' +
                        '</div>' +
                     '</tpl>',

        /**
        * @property 
        */
        autoScroll: true,

        /**
        * @property 
        */
        layout: 'fit',

        /**
        * @property 
        */
        frame: false,

        /**
        * @property 
        */
        border: false,

        /**
        * @property 
        */
        addLayerBtnText: 'Add Layer',

        /**
        * @property 
        */
        addLayerTooltipText: 'Add Layer',

        /**
        * @property 
        */
        addLayerBtnIcon: 'Media/images/silk/icons/add.png'
    },

    /**
    * @private the record in the store representing the currently active layer
    */
    activeLayer: null,

    initComponent: function () {


        this.addEvents({
            'addlayerclicked': true,
            'layeractivated': true,
            'layerdeactivated': true,
            'layerremoved': true,
            'layermoved': true,
            'layeradded': true,
            'layervisibilitychanged': true,
            'layerlabelvisibilitychanged': true
        });

        // create the model
        this.model = Ext.define('FGI.models.Layer', {
            extend: 'Ext.data.Model',
            fields: [
                'id',
                'name',
                'layer',
                'description',
                'hasLabelLayer',
                'showInLegend',
                'legendImage',
                'extent'
            ]
        });

        // need to add a backing store here
        this.store = new Ext.data.ArrayStore({
            model: this.model,
            idIndex: 0 //
        });

        // the data view to render the legned items in
        this.view = new Ext.view.View({
            cls: 'legend-dataview',
            tpl: this.itemTemplate,
            itemSelector: 'div.legend-item',
            overItemCls: 'over',
            selectedItemCls: 'selected',
            singleSelect: true,
            store: this.store,
            autoScroll: true,
            legend: this
        });

        this.view.on('render', function (view) {
            view.tip = Ext.create('Ext.tip.ToolTip', {
                anchor: 'left',
                html: null,
                //width: 215,
                autoHide: false,
                dismissDelay: 3000,
                closable: true,
                items: [{
                    xtype: 'menu',
                    border: false,
                    plain: true,
                    floating: false,
                    items: [{
                        xtype: 'menucheckitem',
                        text: 'Visibility',
                        checked: true,
                        listeners: {
                            click: function (item, evt, options) {
                                var toolTip = item.up('tooltip');
                                toolTip.legendItem.get('layer').setVisibility(item.checked);
                            }
                        }
                    }, {
                        text: 'Zoom to Layer Extent',
                        listeners: {
                            click: function (item, evt, options) {
                                var toolTip = item.up('tooltip');
                                toolTip.legendItem.get('layer').map.zoomToExtent(new OpenLayers.Bounds.fromString(toolTip.legendItem.get('extent')));
                            }
                        }
                    }, {
                        text: 'Remove from Map',
                        disabled: true,
                        listeners: {
                            click: function (item, evt, options) {
                                var toolTip = item.up('tooltip');
                                toolTip.legendItem.get('layer').map.removeLayer(toolTip.legendItem.get('layer'));
                                //item.destroy();
                            }
                        }
                    }, {
                        xtype: 'menuseparator'
                    }, {
                        xtype: 'slider',
                        fieldLabel: 'Transparency',
                        labelAlign: 'top',
                        value: 0,
                        tipText: function (thumb) {
                            return Ext.String.format('{0}%', thumb.value);
                        },
                        listeners: {
                            change: function (slider, newValue, thumb, options) {
                                var toolTip = slider.up('tooltip');
                                toolTip.legendItem.get('layer').setOpacity((100 - newValue) / 100);
                            }
                        }
                    }
                    ]
                }],
                // The overall target element.
                target: view.el,
                // Each grid row causes its own seperate show and hide.
                delegate: view.itemSelector,
                // Moving within the row should not hide the tip.
                trackMouse: false,
                // Render immediately so that tip.body can be referenced prior to the first show.
                renderTo: Ext.getBody(),
                listeners: {
                    // Change content dynamically depending on which element triggered the show.
                    beforeshow: function updateTipBody(tip) {
                        var rec = view.getRecord(tip.triggerElement);
                        tip.setTitle(rec.get('name'));
                        tip.legendItem = rec;
                        //var opacity = rec.get('layer').opacity;
                       // opacity = opacity == null ? 1 : opacity;
                        //tip.down('slider').setValue((opacity * -100) + 100, false);
                        tip.down('menucheckitem').setChecked(rec.get('layer').getVisibility(), true);
                        //tip.update('Over company "' + view.getRecord(tip.triggerElement).get('name') + '"');
                    },
                    show: function (tip, options) {
                        var rec = view.getRecord(tip.triggerElement);
                        var opacity = rec.get('layer').opacity;
                        opacity = opacity == null ? 1 : opacity;
                        tip.down('slider').setValue((opacity * -100) + 100, false);
                    }
                    //                    ,
                    //                    beforehide: function cancelHide(tip) {
                    //                        return doHide;
                    //                    }
                    //                    ,
                    //                    mouseover: {
                    //                        fn: function (tip) {
                    //                            doHide = false;
                    //                            return true;
                    //                        },
                    //                        element: 'el'
                    //                    },
                    //                    mouseout: {
                    //                        fn: function (tip) {
                    //                            doHide = true;
                    //                            return true;
                    //                        },
                    //                        element: 'el'
                    //                    }
                }
            });
        });

        // attach listeners
        this.mon(this.view, {
            beforeitemclick: this.rowClick,
            render: this.initializeLegendDragZone,
            scope: this
        });

        if (this.addLayerBtnText != "" || this.addLayerBtnIcon != "") {
            this.tbar = new Ext.Toolbar({
                bodyStyle: this.bodyStyle,
                items: [new Ext.Button({
                    icon: this.addLayerBtnIcon,
                    tooltip: this.addLayerTooltipText,
                    text: this.addLayerBtnText,
                    scale: 'large',
                    handler: function () {
                        this.fireEvent('addlayerclicked');
                    },
                    scope: this
                })]
            });
        }

        Ext.apply(this, {
            items: this.view
        });

        this.callParent(arguments);
    },

    /**
    * Handles all clicks on a legend item
    * Fires before a click is processed. Return false to cancel the default action.
    * @param {Ext.DataView} the Legend's DataView object
    * @param {Number} index the index of the clicked row
    * @param {HTMLElement} legendItem The target node
    * @param {Ext.EventObject} evt The raw event object
    */
    rowClick: function (theDataView, record, legendItem, index, evt, options) {
        var node = evt.getTarget();
        switch (node.className) {
            case 'row-checker checked':
                // need to return false to make sure the checkbox doesn't get unchecked
                this.hideLayer(index);
                return false;
                break;
            case 'row-checker':
                // need to return false to make sure the checkbox doesn't get unchecked
                this.showLayer(index);
                return false;
                break;

            case 'label':
                this.hideLabel(index);
                break;

            case 'label off':
                this.showLabel(index);
                break;

            case 'remove':
                this.removeLayer(index);
                break;

            case 'legend-name':
                // activate the layer
                this.activateLayer(index);
                break;

            case 'legend-name active':
                // deactivate the layer
                this.deactivateLayer(index);
                break;

            case 'more-less':
                // use jquery to expand/contract metadata

                if ($(node).text() == "more...") {
                    $(node).text("less...");
                    $(legendItem).find('.legend-item-metadata').show('slow');
                } else {
                    $(node).text("more...");
                    $(legendItem).find('.legend-item-metadata').hide('slow');
                }
                break;


        }
    },

    /**
    * method to add a layer to the legend and map
    * @param {OpenLayers.Layer} layer an OpenLayers Layer object to be added to the map
    * @param {Object} options representing the parameters of the layer to be added including
    *   {String} Id unique id of the layer, defaults to the id of the layer
    *   {String} Name name to show in the legend, defaults to the name of the layer
    *   {String} Description a description of the contents of the layer
    *   {boolean} displayInLegend true to show the layer in the legend (the layer will still be added to the map)
    *       also note that to remove the layer, you'll have to go directly to the map object
    *   {boolean} showLabelSwitcher true to show the icon that allows the users to turn on and off the labels for a layer
    *       note that this assumes that a function exits on the layer called "setLabelVisibility"
    * @param {boolean} showInLegend true to show this layer in the legend
    * @return {void} 
    */
    addLayer: function (layer, options) {
        // create a new record with the layer
        var rec = Ext.ModelManager.create({
            id: options.Id || layer.id,
            name: options.Name || layer.name,
            hasLabelLayer: options.showLabelSwitcher || false,
            layer: layer,
            description: options.Description || '',
            displayInLegend: options.displayInLegend || true // unused
        }, this.model);

        // need to insert rather than add so that the new layer is added at the begining
        // rather than at the end, thus mimicing how layers are added to a map
        this.store.insert(0, [rec]);

        // add the layer to the map
        this.map.addLayer(layer);
        this.fireEvent('layeradded', rec);
    },

    /**
    * removes the layer from the map and legend
    * @param {HTMLElement/String/Number/Ext.data.Record} nodeInfo An HTMLElement template node, index of a template node, 
    * the id of a template node or the record associated with the node.
    */
    removeLayer: function (nodeInfo) {
        var theNode = this.view.getNode(nodeInfo);
        if (theNode) {
            $(theNode).find('.legend-name').hide('slow');
            var rec = this.view.getRecord(theNode);
            var layerId = rec.data.id;

            // deactivate the layer
            if (rec == this.activeLayer) {
                this.deactivateLayer(nodeInfo);
            }

            // remove the layer from the map
            rec.data.layer.destroy();

            // remove the layer from the legend
            this.store.remove(rec);
            this.fireEvent('layerremoved', layerId);
        }
    },

    /**
    * actiavtes the layer, shows the layer as a vector
    * @param {HTMLElement/String/Number/Ext.data.Record} nodeInfo An HTMLElement template node, index of a template node, 
    * the id of a template node or the record associated with the node.
    * @return {OpenLayers.Layer} the layer that was activated
    */
    activateLayer: function (nodeInfo) {
        //TODO - de-activate any existing active layers
        var theNode = this.view.getNode(nodeInfo);
        $(".legend-name").removeClass('active');
        if (theNode) {
            $(theNode).find('.legend-name').addClass('active');
            var rec = this.view.getRecord(theNode);

            // set the active layer
            this.activeLayer = rec;

            this.fireEvent('layeractivated', rec);
            return rec.data.layer;
        }
    },

    /**
    * deactiavtes the layer
    * @param {HTMLElement/String/Number/Ext.data.Record} nodeInfo An HTMLElement template node, index of a template node, 
    * the id of a template node or the record associated with the node.
    * @return {OpenLayers.Layer} the layer that was activated
    */
    deactivateLayer: function (nodeInfo) {
        //TODO - de-activate any existing active layers
        var theNode = this.view.getNode(nodeInfo);
        if (theNode) {
            $(theNode).find('.legend-name').removeClass('active');
            var rec = this.view.getRecord(theNode);

            // set the active layer to null
            this.activeLayer = null;

            this.fireEvent('layerdeactivated', rec);
            return rec.data.layer;
        }
    },

    /**
    * moves the layer up or down in the stack
    * @param {HTMLElement/String/Number/Ext.data.Record} nodeInfo An HTMLElement template node, index of a template node, 
    * the id of a template node or the record associated with the node.
    * @param {int} toIndex the index in the legend to move the layer
    */
    moveLayer: function (nodeInfo, toIndex) {
        var theNode = this.view.getNode(nodeInfo);
        if (theNode) {
            var rec = this.view.getRecord(theNode);
            var fromIndex = this.store.indexOf(rec);
            var delta = fromIndex - toIndex; // a negative number moves the layer down, a positive up

            // moving the layer to the same location
            if (delta == 0) return;

            // move the layer in the legend
            var count = this.store.getCount();
            this.store.removeAt(fromIndex);
            if (count - 1 == toIndex) { // moving to the end of the legend
                this.store.add([rec]);
            } else {
                this.store.insert(toIndex, [rec]);
            }

            // move the layer in the map
            this.map.raiseLayer(rec.data.layer, delta);
            this.fireEvent('layermoved', rec);
        }
    },

    /**
    * shows the layer
    * @param {HTMLElement/String/Number/Ext.data.Record} nodeInfo An HTMLElement template node, index of a template node, 
    * the id of a template node or the record associated with the node.
    * @return {OpenLayers.Layer} the layer that was shown
    */
    showLayer: function (nodeInfo) {
        var theNode = this.view.getNode(nodeInfo);
        if (theNode) {
            $(theNode).find(".row-checker").addClass('checked');
            var rec = this.view.getRecord(theNode);
            rec.data.layer.setVisibility(true);

            this.fireEvent('layervisibilitychanged', rec, true);
            return rec.data.layer;
        }
    },

    /**
    * hides the layer
    * @param {HTMLElement/String/Number/Ext.data.Record} nodeInfo An HTMLElement template node, index of a template node, 
    * the id of a template node or the record associated with the node.
    * @return {OpenLayers.Layer} the layer that was hidden
    */
    hideLayer: function (nodeInfo) {
        var theNode = this.view.getNode(nodeInfo);
        if (theNode) {
            $(theNode).find(".checked").removeClass('checked');
            var rec = this.view.getRecord(theNode);
            rec.data.layer.setVisibility(false);

            this.fireEvent('layervisibilitychanged', rec, false);
            return rec.data.layer;
        }
    },

    /**
    * shows the label of the associated layer
    * @param {HTMLElement/String/Number/Ext.data.Record} nodeInfo An HTMLElement template node, index of a template node, 
    * the id of a template node or the record associated with the node.
    * @return {boolean} true if the label was successfully hidden, else false
    */
    showLabel: function (nodeInfo) {
        var theNode = this.view.getNode(nodeInfo);
        if (theNode) {
            $(theNode).find(".off").removeClass('off');
            var rec = this.view.getRecord(theNode);

            this.fireEvent('layerlabelvisibilitychanged', rec, true);
            return rec.data.layer.setLabelVisibility(true);
        }
    },

    /**
    * hides the label the associated layer
    * @param {HTMLElement/String/Number/Ext.data.Record} nodeInfo An HTMLElement template node, index of a template node, 
    * the id of a template node or the record associated with the node.
    * @return {boolean} true if the label was successfully hidden, else false
    */
    hideLabel: function (nodeInfo) {
        var theNode = this.view.getNode(nodeInfo);
        if (theNode) {
            $(theNode).find(".label").addClass('off');
            var rec = this.view.getRecord(theNode);

            this.fireEvent('layerlabelvisibilitychanged', rec, false);
            return rec.data.layer.setLabelVisibility(false);
        }
    },


    /**
    * gets the record of the layer with the passed id
    * @param {String} id the id of the layer to retrieve 
    * @return {boolean} the record or false if not found
    */
    getLayerRecordById: function (id) {
        var idField = this.store.fields.items[this.store.idIndex].name;
        var foundRecord = false;
        this.store.each(function (rec) {
            if (rec.data[idField] == id) {
                foundRecord = rec;
                return false;
            }
        });
        return foundRecord;
    },


    /**
    * a Json representation of the legend to be used for storing state, etc...
    * @return {array} an array of legend item objects
    */
    toJson: function () {
        var output = [];
        Ext.each(this.store.data.items, function (item, index, allitems) {
            var legendItem = {};
            //legendItem['LayerId'] = item.data.id;
            legendItem['Layer'] = {};
            legendItem['Layer']['id'] = item.data.id;
            legendItem['orderIndex'] = index;
            legendItem['opacity'] = 1; // for now this is hard coded
            legendItem['isVisible'] = item.data.layer.visibility;
            legendItem['isLableVisible'] = item.data.hasLabelLayer ? item.data.layer.labelVisibility : null;
            output.push(legendItem);
        }, this);
        return output;
    },


    /**
    * removes all the layers from the legend
    * @param {boolean} true to return a representation of the legend returned by toJson, defaults to false
    * @return optional {array} an array of legend item objects
    */
    clear: function (returnJson) {
        var obj = [];
        if (returnJson) {
            obj = this.toJson();
        }

        // need to remove the items in reverse order
        var numberOfItems = this.store.data.items.length;
        for (var i = numberOfItems - 1; i >= 0; i--) {
            this.removeLayer(i);
        }

        return obj;
    },


    /*
    * Here is where we "activate" the DataView.
    * We have decided that each node with the class "patient-source" encapsulates a single draggable
    * object.
    *
    * So we inject code into the DragZone which, when passed a mousedown event, interrogates
    * the event to see if it was within an element with the class "patient-source". If so, we
    * return non-null drag data.
    *
    * Returning non-null drag data indicates that the mousedown event has begun a dragging process.
    * The data must contain a property called "ddel" which is a DOM element which provides an image
    * of the data being dragged. The actual node clicked on is not dragged, a proxy element is dragged.
    * We can insert any other data into the data object, and this will be used by a cooperating DropZone
    * to perform the drop operation.
    */
    initializeLegendDragZone: function (v) {
        v.dragZone = new Ext.dd.DragZone(v.getEl(), {

            //      On receipt of a mousedown event, see if it is within a draggable element.
            //      Return a drag data object if so. The data object can contain arbitrary application
            //      data, but it should also contain a DOM element in the ddel property to provide
            //      a proxy to drag.
            getDragData: function (e) {
                var sourceEl = e.getTarget(v.itemSelector, 10);
                if (sourceEl) {
                    // get just the layer name to drag
                    d = $(sourceEl).find('.legend-img')[0].cloneNode(true);
                    d.id = Ext.id();
                    return v.dragData = {
                        sourceEl: sourceEl,
                        repairXY: Ext.fly(sourceEl).getXY(),
                        ddel: d,
                        record: v.getRecord(sourceEl),
                        view: v
                    }
                }
            },

            //      Provide coordinates for the proxy to slide back to on failed drag.
            //      This is the original XY coordinates of the draggable element.
            getRepairXY: function () {
                return false;
                return this.dragData.repairXY;
            }
        });
        //Ext.dd.ScrollManager.register(v.container);
        v.dragZone.ignoreSelf = false;

        // This will make sure we only drop to the view container
        var formPanelDropTargetEl = v.container.dom;

        var formPanelDropTarget = new Ext.dd.DropTarget(formPanelDropTargetEl, {
            //ddGroup: 'gridDDGroup',
            notifyEnter: function (ddSource, e, data) {

                //Add some flare to invite drop.
                //formPanel.body.stopFx();
                //formPanel.body.highlight();
                //alert(data);
            },
            notifyDrop: function (ddSource, e, data) {
                // get the html element of the target of the drop
                var theTarget = e.getTarget();

                // get the index in the legend where the user is trying to drop the legend item
                var targetIndex = data.view.indexOf(data.view.findItemByChild(theTarget));

                // move the layer to the new location
                data.view.legend.moveLayer(data.record, targetIndex);

                return (true);
            }
        });
    }

});

// register xtype to allow for lazy initialization
//Ext.reg('fgi-widgets-legend', 'FGI.widgets.Legend');

/**
* Ext.data.Store extension to move a record within the data store
* @param {Number} from Move record from
* @param {Number} to Move record to
*/
Ext.data.Store.prototype.move = function(from, to) {
    var r = this.getAt(from);
    this.removeAt(from);
    this.insert(to, [r]);
    this.fireEvent("move", this, from, to);
};

function test() {
//    var w = new Ext.Window({ width: 200, height: 200, layout: 'fit' });
//    w.add(l = new FGI.widgets.Legend({ map: USD.app.map }));  
//    w.show();

//    Ext.each(json, function(item, index, allitems) {
//        l.addLayer(item, null, null);
    //    }, this);

    USD.app.legend.jsonToEsriLayer(json[0], true);
    USD.app.legend.jsonToEsriLayer(json[4], true);
}

var json = [{
"Id":406,
"Name":"Water Valve",
"LayerIndex":1,
"LabelIndex":null,
"Url":"http://usd-gis1/ArcGIS/rest/services/Water/MapServer/export?",
"MapServiceName":"Water",
"Description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
"IsFavorite":false,
"LayerDef":"",
"Visible": true
}, {
    "Id": 407,
    "Name": "Water Line",
    "LayerIndex": 1,
    "LabelIndex": 0,
    "Url": "http://usd-gis1/ArcGIS/rest/services/Water/MapServer/export?",
    "MapServiceName": "Water",
    "Description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "IsFavorite": false,
    "LayerDef": "",
    "Visible": true
}, {
    "Id": 408,
    "Name": "W1",
    "LayerIndex": 1,
    "LabelIndex": 0,
    "Url": "http://usd-gis1/ArcGIS/rest/services/Water/MapServer/export?",
    "MapServiceName": "Water",
    "Description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "IsFavorite": false,
    "LayerDef": "",
    "Visible": true
}, {
    "Id": 409,
    "Name": "W2",
    "LayerIndex": 1,
    "LabelIndex": 0,
    "Url": "http://usd-gis1/ArcGIS/rest/services/Water/MapServer/export?",
    "MapServiceName": "Water",
    "Description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "IsFavorite": false,
    "LayerDef": "",
    "Visible": true
}, {
    "Id": 410,
    "Name": "Building Outlines",
    "LayerIndex": 2,
    "LabelIndex": "0,1",
    "Url": "http://usd-gis1/ArcGIS/rest/services/BuildingOutlines/MapServer/export",
    "MapServiceName": "BuildingOutlines",
    "Description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "IsFavorite": false,
    "LayerDef": "",
    "Visible": true
}, {
    "Id": 411,
    "Name": "Natural Gas",
    "LayerIndex": 1,
    "LabelIndex": 0,
    "Url": "http://usd-gis1/ArcGIS/rest/services/Water/MapServer/export?",
    "MapServiceName": "Water",
    "Description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "IsFavorite": false,
    "LayerDef": "",
    "Visible": true
}]


//Layer Record:
// baseUrl
// layerIndex
// labelIndex
// name
// visible
// layer
// params.layers
// params.layerDef
// description
// keepOnTop
// showInLegend
