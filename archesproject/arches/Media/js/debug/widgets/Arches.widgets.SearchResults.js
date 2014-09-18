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

Ext.define('Arches.widgets.SearchResults', {
    extend: 'Ext.panel.Panel',
    alias: 'widgets.arches-widgets-searchresults',
    
    i18n: {
        resultsCount: 'results for'
    },
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    bodyStyle: 'background-color: white; border-color: #cacaca;',
    queryParam: 'q',
    initComponent: function () {
        this.store = Ext.create('Ext.data.Store', {
            model:'SearchResult',
            proxy:{
                type: 'ajax',
                url: Arches.config.Urls.search,
                reader: {
                    type: 'json',
                    root: 'hits.hits'
                }
            },
            listeners: {
                'load': function (store, records, successful, operation, eOpts ) {
                    store.proxy.reader.rawData.hits.queryString = store.queryString;
                    this.searchInfo.update(store.proxy.reader.rawData.hits);
                },
                scope: this
            }
        });

        this.searchInfo = Ext.create('Ext.container.Container', {
            height: 60,
            tpl: new Ext.XTemplate(
                '<div style="background-color: #EEE;padding-bottom:5px;">' +
                    '<div style="background-color: #DBDBDB;height: 24px;padding-left: 3px;padding-top: 2px;font-size: 15px;">Search Term</div>' +
                    '<div style="padding-left: 7px;font-size: 14px;color: #2B32D6;">{queryString}</div>' +
                    '<div style="padding-left: 7px;font-size: 11px;line-height: 13px;">{total} result(s)</div>' + 
                '</div>'
            )
        });

        this.list = Ext.create('Ext.view.BoundList', {
            border: false,
            flex: 1,
            autoScroll: true,
            store: this.store,
            tpl: new Ext.XTemplate(
                    '<ul><tpl for=".">',
                        '<li role="option" style= "font-size: 14px;" class="x-boundlist-item">' + Arches.config.Tpls.searchResults + '</li>',
                        '<div style="height:5px;border-bottom:1px solid #E9E9E9">&nbsp;</div>',
                    '</tpl></ul>',
                    Arches.config.Tpls.functions
                ),
            style: 'background: white;border-width: 0px;',
            listeners:{
                'selectionchange': function (view, selections, eOpts) {
                    this.fireEvent('selectionchange', this, view, selections, eOpts);
                },
                'itemmouseenter': function(view, record, item) {
                    this.fireEvent('itemmouseenter', view, record, item);
                },
                'itemmouseleave': function(view, record, item) {
                    this.fireEvent('itemmouseleave', view, record, item);
                },
                'itemclick': function (view, record, item, index, e) {
                    this.fireEvent('itemclick', view, record, item, index, e);
                    this.list.getSelectionModel().deselectAll(true);
                },
                scope:this
            }
        });
        this.list.getSelectionModel().setSelectionMode('SIMPLE');
        this.list.getSelectionModel().deselectOnContainerClick = false;

        this.items = [
            this.searchInfo, 
            this.list, {
                xtype: 'panel',
                height: 36,
                ui: 'fgi_panel_gray_transparent',
                layout: {
                    type: 'hbox',
                    align: 'stretch'
                },
                items: [{ xtype: 'tbfill' },{
                    xtype: 'button',
                    text: 'Clear Search',
                    ui:'fgi_button_white',
                    height: 32,
                    scale: 'medium',
                    iconCls: 'glyph-check',
                    handler: function () {
                        this.clearSearch();
                    },
                    scope: this
                }]
            }
        ];

        this.callParent(arguments);
    },

    clearSearch: function () {
        this.store.removeAll();
        this.searchInfo.hide();
        this.list.hide();
        this.fireEvent('resultscleared');
    },

    query: function(queryString) {
        var params = {},
            param = this.queryParam;
        if (param) {
            params[param] = queryString;
        }
        this.store.queryString = queryString;
        this.searchInfo.show();
        this.list.show();
        this.store.load({
            params: params
        });
    }
});
