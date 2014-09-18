/// <reference path="../../Ext-4.0.1/ext-all-debug.js" />

/** 
* @class FGI.widgets.LayerManager
* @extends Ext.panel.Panel
* @requires Ext 4.0.1
* <p>the general philosophy is that the legned controls or can control the map
* and as its data repository it uses a Ext.data.Store</p>
*/
Ext.define('FGI.widgets.LayerManager', {
    extend: 'Ext.panel.Panel',
    alias: 'fgi-widgets-layermanager',

    //config: {
    /**
    * @property OpenLayers.Map that the store is synchronized with.
    */
    map: null,

    /**
    * @property default template to use for rendering each Layer in the Legend
    */
    itemTemplate: '<tpl for=".">' +
                        '<div class="legend-item">' +
                            '<img class="legend-img{[values.isVisible ? "" : " hide" ]}" src="{layer.iconURL}" />' +
                        '</div>' +
                     '</tpl>',

    /**
    * @property 
    */
    autoScroll: false,

    /**
    * @property 
    */
    layout: {
        type: 'vbox',
        align: 'center'
    },

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
    addLayerBtnIcon: 'Media/images/silk/icons/add.png',
    //},

    store: null,

    initComponent: function () {

        this.addEvents({
            'addlayerclicked': true,
            'layerremoved': true,
            'layermoved': true,
            'layeradded': true,
            'layervisibilitychanged': true
        });


        // create a dummy store just so the view is valid
        // we'll be rebinding to a valid store later
        var model = Ext.define('dummyModel', {
            extend: 'Ext.data.Model',
            fields: [{ name: 'dummyField'}]
        });

        var store = Ext.create('Ext.data.Store', {
            model: model,
            autoLoad: false,
            autoSave: false
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
            autoScroll: false,
            legend: this,
            maxHeight: 200,
            //height: 100,
            flex: 3
        });

        this.view.on('render', function (view) {
            view.tip = Ext.create('Ext.tip.ToolTip', {
                anchor: 'left',
                html: null,
                layout: 'fit',
                autoHide: false,
                dismissDelay: 15000,
                closable: true,
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
                    show: function (tip, options) {
                        var rec = view.getRecord(tip.triggerElement);
                        tip.setTitle(rec.get('layer').displayName);
                        tip.legendItem = rec;
                        tip.removeAll();
                        tip.add(new CalEMA.widgets.LayerManagerPopup.WMS({ legendItem: rec }));
                        tip.doLayout();
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

        this.scrollUpBtn = Ext.create('Ext.Button', {
            tooltip: 'scroll up',
            icon: 'Media/images/scroll_up_icon.jpg',
            width: 40,
            maxHeight: 16,
            flex: 1,
            style: {
                marginBottom: '10px'
            },
            listeners: {
                render: {
                    fn: function () {
                        $('#' + this.scrollUpBtn.id).bind(
                            'mousedown',
                            { scope: this },
                            function (b) {
                                b.data.scope.scroll('up');
                            }
                        );
                        $('#' + this.scrollUpBtn.id).bind(
                            'mouseup',
                            { scope: this },
                            function (b) {
                                b.data.scope.stopScroll();
                            }
                        );
                        $('#' + this.scrollUpBtn.id).bind(
                            'mouseout',
                            { scope: this },
                            function (b) {
                                b.data.scope.stopScroll();
                            }
                        );
                    },
                    scope: this
                }
            },
            scope: this
        });

        this.timer = null;

        this.scroll = function (direction) {
            if (!this.element) {
                this.element = Ext.get(this.view.id);
            }
            this.element.scroll(direction, 2, false);
            this.timer = Ext.Function.defer(this.scroll, 10, this, [direction]);
        };

        this.stopScroll = function () {
            clearTimeout(this.timer);
        };

        this.scrollDownBtn = Ext.create('Ext.Button', {
            tooltip: 'scroll down',
            icon: 'Media/images/scroll_down_icon.jpg',
            width: 40,
            maxHeight: 16,
            flex: 1,
            style: {
                marginTop: '10px'
            },
            listeners: {
                render: {
                    fn: function () {
                        $('#' + this.scrollDownBtn.id).bind(
                            'mousedown',
                            { scope: this },
                            function (b) {
                                b.data.scope.scroll('down');
                            }
                        );
                        $('#' + this.scrollDownBtn.id).bind(
                            'mouseup',
                            { scope: this },
                            function (b) {
                                b.data.scope.stopScroll();
                            }
                        );
                        $('#' + this.scrollDownBtn.id).bind(
                            'mouseout',
                            { scope: this },
                            function (b) {
                                b.data.scope.stopScroll();
                            }
                        );
                    },
                    scope: this
                }
            }
        });

        Ext.apply(this, {
            items: [
                this.scrollUpBtn,
                this.view,
                this.scrollDownBtn
            ]
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
            rec.data.olLayer.destroy();

            // remove the layer from the legend
            this.store.remove(rec);
            this.fireEvent('layerremoved', layerId);
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

            this.syncData();

            // move the layer in the map
            this.map.raiseLayer(rec.data.olLayer, delta);
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
            rec.data.olLayer.setVisibility(true);

            this.fireEvent('layervisibilitychanged', rec, true);
            return rec.data.olLayer;
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
            rec.data.olLayer.setVisibility(false);

            this.fireEvent('layervisibilitychanged', rec, false);
            return rec.data.olLayer;
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

    /**
    * syncs the data in the store with the store properties
    * @return void
    */
    syncData: function () {
        var i = 0;
        this.store.each(function (record) {
            record.set('orderIndex', i++);
        }, this);
    },

    setMap: function (map) {
        this.map = map;
        //        this.map.events.register('zoomend', this, function (evt, evtEl) {
        //            this.setAutoDisplay();
        //        });
    },

    /**
    * sets the legend icon to reflect the display range of the layer
    * @return void
    */
    setAutoDisplay: function () {
        var nodes = this.view.getNodes();
        var resolution = this.map.getResolution();
        Ext.each(nodes, function (item, index, allItems) {
            var x = this.view.getRecord(item).get('layer').minScale;
        }, this);
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

