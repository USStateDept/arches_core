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

Ext.define('Arches.widgets.InfoThemeSelector', {
    extend: 'Ext.view.View',

    tpl: [
        '<tpl for=".">',
            '<div class="thumb-wrap" id="{name}">',
                '<div class="info-thumb {displayclass}-informationtheme-icon">',
                    '<span style="font-size:14px;">{name}</span>',
                '</div></div>',
            '</div>',
        '</tpl>',
        '<div class="x-clear"></div>'
    ],
    trackOver: true,
    overItemCls: 'x-item-over',
    itemSelector: 'div.thumb-wrap',
    multiSelect: false,
    singleSelect: true,
    autoScroll: true,
    cls: 'images-view',
    style: 'color:#5D5D5D;',
    entityTypeId: null,
    loadMask: false,

    initComponent: function () {
        this.store = Ext.create('Ext.data.Store', {
            model: 'Arches.models.InformationTheme',
            data: Arches.i18n.DomainData.InformationThemes
        });

        this.callParent();

        this.on({
            'selectionchange': function (view, selections) {
                if (selections.length > 0) {
                    this.getSelectionModel().deselectAll();
                    this.fireEvent('infothemeselected', view, selections);
                }
            },
            scope: this
        });
    },

    setEntityType: function(entityTypeId) {
        var defaultInformationThemeId;
        this.store.clearFilter();
        Ext.each(Arches.i18n.DomainData.EntityTypes, function (item, index, allItems) {
            if (item.entitytypeid === entityTypeId) {
                defaultInformationThemeId = item.defaultinformationthemeid;
            }
        }, this);
        this.store.filter([
            {property: 'entitytypeid', value: entityTypeId},
            {filterFn: function(item) { return item.get('id') !== defaultInformationThemeId; }}
        ]);
    }
});