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

Ext.define('Arches.widgets.EntityTypeSelector', {
    extend: 'Ext.container.Container',

    i18n: {
        allResourceTypes: 'All Resource Types'
    },

    entityTypeId: null,
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    initComponent: function () {
        var groupButtons = [{
                xtype: 'button',
                ui: 'fgi_button_white',
                text: ' ',
                scale: 'medium',
                iconAlign: 'top',
                iconCls: 'glyph-aerial',
                enableToggle: true,
                pressed: true,
                toggleGroup: 'entitytypeselector-groupfilters',
                allowDepress: false,
                handler: function (button) {
                    this.store.clearFilter();
                    header.update({
                        groupname: this.i18n.allResourceTypes
                    });
                },
                scope: this,
                width: 46,
                height: 34,
                style: 'margin: 2px;'
            }],
            groups = [];

        this.store = Ext.create('Ext.data.Store', {
            data: Arches.i18n.DomainData.EntityTypes,
            model: 'Arches.models.EntityType',
            groupField: 'groupname'
        });

        this.store.each(function (record) {
            if (!record.get('isresource')) {
                this.store.remove(record);
            } else if (!Ext.Array.contains(groups, record.get('groupname'))) {
                groups.push(record.get('groupname'));
                groupButtons.push({
                    xtype: 'button',
                    ui: 'fgi_button_white',
                    text: ' ',
                    scale: 'medium',
                    iconAlign: 'top',
                    iconCls: record.get('groupdisplayclass') + '-resourcegroup-icon',
                    enableToggle: true,
                    toggleGroup: 'entitytypeselector-groupfilters',
                    allowDepress: false,
                    handler: function (button) {
                        this.store.clearFilter();
                        this.store.filter('groupname', record.get('groupname'));
                        header.update({
                            groupname: record.get('groupname')
                        });
                    },
                    scope: this,
                    width: 46,
                    height: 34,
                    style: 'margin: 2px;'
                })
            }
        }, this);

        var header = Ext.create('Ext.container.Container', {
            dock: 'top',
            height: 36,
            cls: 'group-filter-header',
            tpl: '{groupname}',
            data: {
                groupname: this.i18n.allResourceTypes
            }
        });

        this.items = [
            Ext.create('Ext.panel.Panel', {
                dock: 'top',
                layout: {
                    type: 'hbox',
                    align: 'middle'
                },
                height: 44,
                ui: 'fgi_panel_gray_transparent',
                items: [groupButtons]
            }),
            header,
            Ext.create('Ext.view.BoundList', {
                flex: 1,
                border: false,
                autoScroll: true,
                style: 'color:#5D5D5D;',
                store: this.store,
                tpl: new Ext.XTemplate(
                    '<ul><tpl for=".">',
                        '<li role="option" class="x-boundlist-item" style="border-bottom:1px solid #E9E9E9;padding: 4px 5px 5px 5px;">',
                        '<div style="height:47px;">',
                            '<div style="width: 36px;float:left;">',
                                '<div class="legend-icon-wrap"><img src="' + Arches.config.Urls.mediaPath + 'images/AssetIcons/{[this.getPropertyValueFromEntityTypeId(this.getEntityTypeId(values), "icon")]}.png"></img></div>',
                            '</div>',
                            '<div style="white-space:nowrap;overflow-x:hidden;padding-left:5px;">',
                                '<div class="basemap-list-name">{[Ext.String.capitalize(values.entitytypename.toLowerCase())]}</div>',
                        '</div></div>',
                        '</li>',
                    '</tpl></ul>',
                    Arches.config.Tpls.functions
                ),
                style: 'background: white;border-width: 0px;',
                listeners:{
                    'selectionchange': function (view, selections, eOpts) {
                        if (selections.length > 0) {
                            this.fireEvent('typeselected', view, selections[0]);
                            view.deselect(selections);
                        }
                    },
                    'itemdblclick': function (view, record, item, index, e) {
                        this.fireEvent('typedblclick', view, record, item);
                    },
                    scope:this
                }
            })
        ];

        this.callParent();
    }
});