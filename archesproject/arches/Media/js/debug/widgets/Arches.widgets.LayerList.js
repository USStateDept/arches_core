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

Ext.define('Arches.widgets.LayerList', {
    extend: 'Ext.panel.Panel',
    alias: 'widgets.arches-widgets-layerlist',
    

    i18n: {
        title: 'Map Layers',
        backButtonText: 'Back',
        showAllButtonText: 'Show All',
        hideAllButtonText: 'Hide All'
    },

    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    bodyStyle: 'background-color: white; border-color: #cacaca;',
    groupFilters: [],

    initComponent: function () {
        this.store = Ext.create('Ext.data.Store', {
            model: 'Arches.models.Layer',
            sorters: [
                {
                    property : 'sortorder',
                    direction: 'ASC'
                }
            ]
        });

        this.store.on({
            'update': function (store, record) {
                var layer = record.get('layer');
                layer.setVisibility(record.get('active'));
                if (typeof layer.clearGrid === 'function' && record.get('active')) {
                    layer.clearGrid();
                    layer.redraw();
                }
            },
            'add': function (store, records) {
                Ext.each(records, function (record) {
                    this.addGroupFilter(record.get('layergroup'));
                    if (!record.get('active') && record.get('layer')) {
                        record.get('layer').setVisibility(false);
                    }
                }, this);                
            },
            scope: this
        });

        this.gridHeader = Ext.create('Ext.container.Container', {
            dock: 'top',
            height: 36, 
            tpl: '<div class="group-filter-header">{groupname}</div>',
            data: {
                groupname: 'All Map Layers'
            }
        });

        this.layerGrid = Ext.create('Ext.grid.Panel', {
            dockedItems: [this.gridHeader],
            bodyStyle: 'border-width:0px;',
            store: this.store,
            columns: [{
                dataIndex: 'icon',
                width: 40,
                renderer: function (value, metadata, record) {
                    var content = '';
                    if (!value) {
                        value = 'unknown';
                    }
                    if (!record.get('active')) {
                        content = '<div style="height: 48px;position: absolute;width: 32px;background-color: #DBDBDB;opacity: 0.75;filter: alpha(opacity = 75);"></div>'
                    }
                    return Ext.String.format(content + '<div class="legend-icon-wrap"><img src="{0}images/AssetIcons/{1}.png"></img></div>', Arches.config.Urls.mediaPath, value);
                }
            }, {
                header: 'Name',
                dataIndex: 'name',
                flex: 1,
                renderer: function (value, metadata, record) {
                    var showHideLinkText = 'show layer',
                        linkClass = 'layer-off';

                    if (record.get('active')) {
                        showHideLinkText = 'hide layer';
                        linkClass = 'layer-on';
                    }
                    return Ext.String.format('<div style="float:left; padding-top: 6px;" data-qtip="Click and drag to reorder."><div style="font-size: 14px;" class="layer-list-name {0}">{1}</div><div><a href="#" class="layervisibilitylink" data-qtip="Click to toggle layer visibility.">{2}<a> | <a href="#" class="layerinfolink" data-qtip="Click to view detailed information about this layer.">layer properties<a></div></div>', linkClass, value, showHideLinkText);
                }
            }],
            scroll: false,
            viewConfig: {
                style : {
                    overflow  : 'auto',
                    overflowX : 'hidden'
                },
                stripeRows: false,
                plugins: {
                    ptype: 'gridviewdragdrop'
                },
                listeners: {
                    beforedrop: function (node, data, dropRec, dropPosition) {
                        //Get the sequence number of the record dropped on
                        var recordSequence = dropRec.get('sequence');
                        //The record being dragged
                        var dragRecord = data.records[0];
                        //Get the sequence number of the drag record currently
                        var dragRecordCurrSequence = data.records[0].get('sequence');

                        //Calculate what the new sequence number should be for the dragged 
                        //row based on where it is dropped.
                        if (dropPosition == 'after' && recordSequence < dragRecordCurrSequence) {
                            dragRecord.set('sequence', recordSequence + 1);
                        } else if (dropPosition == 'before' && recordSequence > dragRecordCurrSequence) {
                            dragRecord.set('sequence', recordSequence - 1);
                        } else {
                            dragRecord.set('sequence', recordSequence);
                        }
                    },
                    drop: function() {
                        this.layerGrid.getSelectionModel().deselectAll(true);
                        this.reindexLayers();
                    },
                    scope: this
                }
            },
            hideHeaders: true,
            border: false,
            listeners: {
                'itemclick': function (view, record, item, index, e) {
                    switch(e.getTarget().className){
                        case 'layervisibilitylink':
                            record.set('active', !record.get('active'));
                            this.layerGrid.store.each(function (rec, index, all) {
                                this.layerGrid.getView().removeRowCls(index, 'x-grid-row-focused');
                            }, this);
                            break;
                        case 'removelayerlink':
                            this.fireEvent('removelayerclicked', record);
                            break;
                        case 'layerinfolink':
                            this.showLayerInfo(record);
                            break;
                    }
                    this.layerGrid.getSelectionModel().deselectAll(true);
                },
                scope: this
            }
        });

        this.layerInfoPanel = Ext.create('Ext.panel.Panel', {
            border: false,
            tpl: new Ext.XTemplate('<div style="height:26px;padding-top:3px;">' +
                '<div>{name}</div>' +
                '<tpl if="symbology">' +
                    '<div><img src="' + Arches.config.Urls.mediaPath + 'images/layer_symbology/{symbology}.png"></img></div>' +
                '</tpl>' +
            '</div>'),
            bodyStyle: "padding:5px;border-width: 0px;",
            dockedItems: [{
                xtype: 'panel',
                height: 36,
                ui: 'fgi_panel_gray_transparent',
                layout: {
                    type: 'hbox',
                    align: 'stretch'
                },
                items: [{
                    xtype: 'button',
                    ui: 'fgi_button_white',
                    scale: 'medium',
                    width: 85,
                    text: this.i18n.backButtonText,
                    id: 'layer-info-back-btn',
                    iconCls: 'glyph-arrowwest',
                    disabled: true,
                    handler: function () {
                        Ext.getCmp('layer-info-back-btn').disable();
                        this.layerInfoPanel.getEl().slideOut('r', {
                            duration: 200,
                            listeners: {
                                afteranimate: function () {
                                    this.cardPanel.layout.setActiveItem(this.layerGrid);
                                    this.layerGrid.hide();
                                    this.layerGrid.getEl().slideIn('l', {
                                        duration: 200
                                    });
                                },
                                scope: this
                            }
                        });
                    },
                    scope: this
                }],
                dock: 'top'
            }]
        });
        this.cardPanel = Ext.create('Ext.container.Container', {
            items: [
                this.layerGrid,
                this.layerInfoPanel
            ],
            layout: 'card',
            border: false,
            style: 'background: white;',
            flex: 1
        });
        this.items = [this.cardPanel];

        this.groupFilterControls = Ext.create('Ext.panel.Panel', {
            dock: 'top',
            layout: {
                type: 'hbox',
                align: 'middle'
            },
            height: 44,
            ui: 'fgi_panel_gray_transparent',
            items: [{
                xtype: 'button',
                ui: 'fgi_button_white',
                text: ' ',
                scale: 'medium',
                iconAlign: 'top',
                iconCls: 'glyph-layers',
                enableToggle: true,
                pressed: true,
                toggleGroup: 'layer-list-groupfilters',
                allowDepress: false,
                toggleHandler: function (button, state) {
                    if (state) {
                        this.store.clearFilter();
                        this.gridHeader.update({
                            groupname: 'All Map Layers'
                        });
                    }
                },
                scope: this,
                width: 46,
                height: 34,
                style: 'margin: 2px;'         
            }]
        });

        this.dockedItems = [this.groupFilterControls];

        this.callParent(arguments);
    },

    addGroupFilter: function (groupName) {
        if (!Ext.Array.contains(this.groupFilters, groupName)) {
            var groupFilterControl = Ext.create('Ext.button.Button', {
                ui: 'fgi_button_white',
                text: ' ',
                scale: 'medium',
                iconAlign: 'top',
                iconCls: groupName.split(' ').join('').toLowerCase() + '-layergroup-icon',
                enableToggle: true,
                toggleGroup: 'layer-list-groupfilters',
                allowDepress: false,
                toggleHandler: function (button, state) {
                    if (state) {
                        this.store.clearFilter();
                        this.store.filter('layergroup', groupName);
                        this.gridHeader.update({
                            groupname: groupName
                        });
                    }
                },
                scope: this,
                width: 46,
                height: 34,
                style: 'margin: 2px;'         
            });

            this.groupFilterControls.insert(0, groupFilterControl);

            this.groupFilters.push(groupName);
        }
    },

    reindexLayers: function() {
        this.store.data.each(function(rec, index, total) {
            var layer = rec.get('layer');
            layer.map.setLayerIndex(layer, (total-index));
        });
        this.fireEvent('layersreindexed');
    },

    showLayerInfo: function (record) {
        this.layerInfoPanel.update(record.data);

        this.layerGrid.getEl().slideOut('l', {
            duration: 200,
            listeners: {
                afteranimate: function () {
                    this.cardPanel.layout.setActiveItem(this.layerInfoPanel);
                    this.layerInfoPanel.hide();
                    this.layerInfoPanel.getEl().slideIn('r', {
                        duration: 200,
                        listeners: { 
                            afteranimate: function () {
                                Ext.getCmp('layer-info-back-btn').enable();
                            },
                            scope: this 
                        }
                    });
                },
                scope: this
            }
        });
    }
});