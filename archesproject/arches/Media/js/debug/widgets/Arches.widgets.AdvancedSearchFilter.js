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

Ext.define('Arches.widgets.AdvancedSearchFilter', {
    extend: 'Ext.container.Container',
    alias: 'widget.arches-widgets-advancedsearchfilter',

    i18n: {

    },
    layout: 'auto',
    filterTitle: 'filter',
    expanded: false,
    childContainer: {
        xtype: 'container',
        html: 'filter control'
    },

    initComponent: function () {
        this.items = [
            {
                xtype: 'container',
                html: '<a href="#" class="advsearch-filter-link">> ' + this.filterTitle + '</a>'
            },
            this.childContainer
        ];

        this.on({
            'afterrender': function () {
                this.childContainer = this.items.items[1];
                this.childContainer.hide();

                this.getEl().down('.advsearch-filter-link').on({
                    'click': function() {
                        if (this.expanded) {
                            this.collapse();
                        }
                        else {
                            this.expand();
                        }
                    },
                    scope: this
                });
            },
            scope: this
        });

        this.callParent(arguments);
    },

    expand: function () {
        this.childContainer.show();
        this.getEl().down('.advsearch-filter-link').addCls('expanded');
        this.expanded = true;
    },

    collapse: function () {
        this.childContainer.hide();
        this.getEl().down('.advsearch-filter-link').removeCls('expanded');
        this.expanded = false;
    }
});