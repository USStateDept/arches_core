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

Ext.define('Arches.widgets.LayerLibrary', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.arches-widgets-layerlibrary',

    ui: 'fgi_panel_gray',
    border: true,
    floating: true,
    closable: false,
    closeAction: 'hide',
    height: 550,
    width: 916,
    autoShow: false,
    layout: 'fit',
    modal: true,

    initComponent: function () {
        this.addEvents({
            'basemapselected': true,
            'layerselected': true,
            'layerdeselected': true,
            'hide': true
        });

        this.layerTpl = [
            '<tpl for=".">',
                '<div class="thumb-wrap" style="width:177px;height:180px;">',
                    '<div style="height: 36px;line-height: 16px;"><span style="font-weight:bold;">{name}</span></div>',
                    '<div style="width: 167px;height: 132px;border:1px solid black"><img src="' + Arches.config.Urls.mediaPath + 'images/layer_thumbnails/{thumbnail}.png" title="{name}"  style="width: 165px;height: 130px;""></div>',
                '</div>',
            '</tpl>',
            '<div class="x-clear"></div>'
        ];

        this.basemapsStore = Ext.create('Ext.data.Store', {
            model: 'Arches.models.Layer',
            sorters: [{
                property : 'sortorder',
                direction: 'ASC'
            }],
            data: Arches.i18n.MapLayers.basemaps
        });

        this.basemapsView = Ext.create('Ext.view.View', {
            tpl: this.layerTpl,
            trackOver: true,
            overItemCls: 'x-item-over',
            itemSelector: 'div.thumb-wrap',
            multiSelect: false,
            singleSelect: true,
            allowDeselect: false,
            autoScroll: true,
            cls: 'images-view',
            region: 'center',
            store: this.basemapsStore,
            listeners: {
                'selectionchange': function (view, selections) {
                    if (selections[0]) {
                        this.fireEvent('basemapselected', selections[0]);
                    } else {
                        var basemapRecord = this.basemapsStore.findRecord('onMap', true);
                        this.basemapsView.getSelectionModel().select(basemapRecord);
                    }
                },
                scope: this
            }
        });
        this.basemapsView.getSelectionModel().deselectOnContainerClick = false

        var tabs = [
            Ext.create('Ext.panel.Panel', {
                tabTitle: 'Basemaps',
                tabIconCls: 'glyph-globe',
                ui: 'fgi_panel_white',
                autoScroll: true,
                layout: 'border',
                items: [
                    {
                        xtype: 'container',
                        region: 'north',
                        height: 50,
                        style: 'padding: 5px;',
                        html: '<span style="font-size: 18px;">Available Basemaps </span>' +
                            '<span>You may select any one of the following basemaps.</span>'
                    },
                    this.basemapsView
                ]
            })
        ];

        this.layerGroupStore = Ext.create('Ext.data.Store', {
            model: 'Arches.models.LayerGroup',
            data: Arches.i18n.MapLayers,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'layerGroups'
                }
            }
        });

        this.layerGroupStore.each(function (record) {
            var store = record.layers();
            var view = Ext.create('Ext.view.View', {
                tpl: this.layerTpl,
                trackOver: true,
                overItemCls: 'x-item-over',
                itemSelector: 'div.thumb-wrap',
                multiSelect: true,
                singleSelect: false,
                autoScroll: true,
                cls: 'images-view',
                region: 'center',
                store: store,
                listeners: {
                    'selectionchange': function (view, selections) {
                        view.store.each(function (record) {
                            if (Ext.Array.contains(selections, record)) {
                                if (!record.get('onMap')) {
                                    this.fireEvent('layerselected', record);
                                }
                            } else {
                                if (record.get('onMap')) {
                                    this.fireEvent('layerdeselected', record);
                                }
                            }
                        }, this);
                    },
                    scope: this
                }
            });
            store.sort('sortorder', 'ASC');
            record.set('dataview', view);
            view.getSelectionModel().setSelectionMode('SIMPLE');
            view.getSelectionModel().deselectOnContainerClick = false;
            tabs.push(Ext.create('Ext.panel.Panel', {
                tabTitle: record.get('name'),
                tabIconCls: record.get('name').toLowerCase().replace(' ', '') + '-layergroup-icon',
                ui: 'fgi_panel_white',
                autoScroll: true,
                layout: 'border',
                items: [
                    {
                        xtype: 'container',
                        region: 'north',
                        height: 75,
                        style: 'padding: 5px;',
                        layout: {
                            type: 'vbox',
                            align: 'stretch'
                        },
                        items: [{
                            xtype: 'container',
                            height: 32,
                            html: '<span style="font-size: 18px;">' + record.get('name') + ' Layers </span>' +
                                '<span>You may select multiple data layers from this category.</span>'
                        }, {
                            xtype: 'textfield',
                            hideLabel: true,
                            emptyText: 'Find a layer...',
                            height: 26,
                            listeners: {
                                'change': function (field, val) {
                                    store.clearFilter();
                                    if (val) {
                                        store.filter({
                                            property: 'name',
                                            value: val,
                                            caseSensitive: false,
                                            anyMatch: true
                                        });
                                    }
                                    store.each(function(record) {
                                        if (record.get('onMap')) {
                                            view.getSelectionModel().select(record, true, true);
                                        }
                                    }, this);
                                },
                                scope: this
                            } 
                        }]
                    },
                    view
                ]
            }));
        }, this);

        this.items = [
            Ext.create('FGI.widgets.SideTabPanel', {
                items: tabs
            })
        ];

        this.closeBtn = Ext.create('Ext.button.Button',{
            ui: 'fgi_button_white',
            style: 'margin-bottom: 3px;',
            tooltip: 'Close',
            scale: 'medium',
            iconAlign: 'top',
            text: ' ',
            iconCls: 'glyph-x',
            handler: function () {
                this.fireEvent('hide');
            },
            scope: this,
            width: 32,
            height: 32
        });

        this.dockedItems = [{
            xtype: 'container',
            dock: 'top',
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            height: 34,
            items: [{
                xtype: 'container',
                flex: 1,
                html: 'Basemaps and GIS Data',
                cls: 'legend-info-header'
            }, 
                this.closeBtn
            ]
        },{
            xtype: 'container',
            dock: 'bottom',
            height: 40,
            style: 'padding: 4px;',
            layout: {
                type: 'hbox',
                align: 'stretch',
                pack: 'end'
            },
            items: [{
                xtype: 'button',
                ui: 'fgi_button_white',
                scale: 'medium',
                width: 85,
                text: 'OK',
                iconCls: 'glyph-check',
                handler: function () {
                    this.fireEvent('hide');
                },
                scope: this
            }]
        }];

        this.callParent(arguments);

        this.on('show', function () {
            this.basemapsView.getSelectionModel().select([this.basemapsStore.findRecord('onMap', true)]);
        }, this);
    }
});