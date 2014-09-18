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
Ext.define('Arches.widgets.BasemapSelector', {
    extend: 'Ext.view.BoundList',

    tpl: [
        '<ul><tpl for=".">',
            '<li role="option" class="x-boundlist-item" style="border-bottom:1px solid #E9E9E9;padding: 4px 5px 5px 5px;">',
            '<div style="height:47px;">',
                '<div style="width: 36px;float:left;">',
                    '<div class="legend-icon-wrap"><img style="width:32px;height:32px;" src="' + Arches.config.Urls.mediaPath + 'images/AssetIcons/{icon}.png"></img></div>',
                '</div>',
                '<div style="white-space:nowrap;overflow-x:hidden;padding-left:5px;">',
                    '<div class="basemap-list-name">{name}</div>',
            '</div></div>',
            '</li>',
        '</tpl></ul>'
    ],
    trackOver: true,
    overItemCls: 'x-item-over',
    itemSelector: 'div.thumb-wrap',
    multiSelect: false,
    singleSelect: true,
    allowDeselect: false,
    autoScroll: true,
    cls: 'images-view',
    style: 'border: 1px solid #EEEEEE;',

    initComponent: function () {
        this.store = Ext.create('Ext.data.Store', {
            model: 'Arches.models.Layer',
            sorters: [{
                property : 'sortorder',
                direction: 'ASC'
            }],
            data: Arches.i18n.MapLayers.basemaps
        });

        this.callParent();

        this.on({
            'afterrender': function () {
                this.getSelectionModel().select([this.store.findRecord('onMap', true)]);
            },
            'selectionchange': function (view, selections) {
                if (selections[0]) {
                    this.fireEvent('basemapselected', selections[0]);
                } else {
                    var basemapRecord = this.basemapsStore.findRecord('onMap', true);
                    this.basemapsView.getSelectionModel().select(basemapRecord);
                }
            },
            scope: this
        });

        this.getSelectionModel().deselectOnContainerClick = false;
    }
});