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

Ext.define('Arches.widgets.SidePanelContainer', {
    extend: 'Ext.container.Container',
    alias: 'widgets.arches-widgets-sidepanelcontainer',

    i18n: {
        title: 'title',
        subtitle: 'subtitle'
    },

    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    style: 'border: 3px solid #D2D2D2;',

    contentContainer: {
        xtype: 'container',
        html: 'content here...'
    },

    initComponent: function () {
        this.contentContainer.flex = 1;

        this.titleContainer = Ext.create('Ext.container.Container', {
            tpl: new Ext.XTemplate('<tpl if="entitytypeid">',
                    '<div style="float:left;width:40px;"><img src="' + Arches.config.Urls.mediaPath + 'images/AssetIcons/{[this.getPropertyValueFromEntityTypeId(values.entitytypeid, "icon")]}.png" id="ext-gen2524" style="vertical-align:middle; height:36px; width: 36px;"></div>',
                '</tpl>',
                '<div style="display:table-cell;vertical-align:middle;">',
                    '<span style="font-size:18px;">{title}</span></br><span style="font-size:14px;">{subtitle}</span>',
                '</div>',
                Arches.config.Tpls.functions),
            data: this.i18n,
            flex: 1
        });

        this.items = [{
                xtype: 'container',
                height: 64,
                layout: {
                    type: 'hbox',
                    align: 'middle'
                },
                items: [
                    this.titleContainer,{
                        xtype: 'button',
                        ui: 'fgi_button_white',
                        scale: 'medium',
                        text: ' ',
                        height: 32,
                        width: 32,
                        iconCls: 'glyph-play',
                        handler: function () {
                            this.fireEvent('collapseclicked', this);
                        },
                        scope: this            
                    }
                ],
                cls: 'legend-info-header'
        }, this.contentContainer];

        this.callParent(arguments);
    },

    updateTitle: function (title, subtitle, entitytypeid) {
        this.titleContainer.update({
            title: Ext.String.ellipsis(title, 54, false),
            subtitle: subtitle,
            entitytypeid: entitytypeid
        });
    }
});