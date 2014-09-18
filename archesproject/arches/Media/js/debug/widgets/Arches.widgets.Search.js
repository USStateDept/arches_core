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

Ext.define('Arches.widgets.Search', {
    extend: 'Ext.container.Container',
    alias: 'widgets.arches-widgets-search',
    
    i18n: {
        resultsCount: 'results for'
    },
    layout: 'hbox',
    border: false,
    ui: 'fgi_panel_gray_transparent',
    width: 590,
    queryParam: 'q',
    expanded: false,
    initComponent: function () {
        this.searchCombo = Ext.create('Ext.form.field.ComboBox', {
            triggerCls: 'x-form-search-trigger',
            triggerAction: 'query',
            name: 'mapsearch',
            store: Ext.create('Ext.data.Store', {
                model:'SearchTermResult',
                proxy:{
                    type: 'ajax',
                    url: Arches.config.Urls.term_search,
                    reader: {
                        type: 'json',
                        root: 'hits.hits'
                    }
                }
            }),
            minChars: 1,
            queryParam: 'q',
            displayField: 'term',
            valueField: 'term',
            emptyText: this.i18n.entitySearchMask,
            width: this.width-130,
            height: 32,
            fieldStyle: 'height:32px;font-size:14px;',
            hideTrigger:true,
            listeners: {
                'select': function () {
                    this.fireEvent('searchbuttonclicked', this.searchCombo.getValue());
                },
                'specialkey': function (comboBox, e) {
                    if (e.getCharCode() == e.ENTER) {
                        this.fireEvent('searchbuttonclicked', this.searchCombo.getValue());
                    }
                },
                scope: this
            }
        });

        this.items = [
            this.searchCombo, {
            xtype: 'container',
            layout: 'fit',
            items: [{
                xtype: 'button',
                id: 'searchTypeBtn',
                ui: 'fgi_button_white',
                scale: 'medium',
                text: ' ',
                height: 32,
                width: 40,
                iconCls: 'glyph-magnify',
                iconAlign: 'top',
                handler: function () {
                    this.fireEvent('searchbuttonclicked', this.searchCombo.getValue());
                },
                scope: this
            }]
        }];

        this.callParent(arguments);
    }
});
