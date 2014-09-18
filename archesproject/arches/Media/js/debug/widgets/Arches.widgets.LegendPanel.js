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

Ext.define('Arches.widgets.LegendPanel', {
    extend: 'Ext.container.Container',
    alias: 'widgets.arches-widgets-legendpanel',

    i18n: {

    },

    width: 80,
    layout: 'fit',
    style: 'background: #616161;',
    expandedWidth: 400,
    collapsedWidth: 80,
    isExpanded: false,
    activeLegendTab: null,
    contentChildren: [],
    expandButtons: [],
    contentChildrenContainers: [],

    initComponent: function () {
        var collapseListener = {
            'collapseclicked': function (container) {
                this.collapse();
            },
            scope: this
        };

        Ext.each(this.contentChildren, function (child) {
            var container = Ext.create('Arches.widgets.SidePanelContainer', {
                    i18n: child.containerConfig.i18n,
                    contentContainer: child,
                    listeners: collapseListener
                }),
                button = Ext.create('Ext.button.Button', {
                    ui: 'fgi_button_grey',
                    cls: 'side-panel-btn',
                    text: child.containerConfig.i18n.buttonText,
                    scale: 'medium',
                    iconAlign: 'top',
                    hidden: child.containerConfig.hideButton,
                    iconCls: child.containerConfig.buttonIconCls,
                    enableToggle: true,
                    toggleGroup: 'legend-nav-buttons',
                    handler: function (button) {
                        if (this.isExpanded && !button.pressed) {
                            this.collapse();
                        } else {
                            this.expand(child);
                        }
                    },
                    scope: this,
                    width: 80,
                    height: 80
                });

            child.toggleButton = button;
            this.expandButtons.push(button);
            this.contentChildrenContainers.push(container);
        }, this);

        this.contentContainer = Ext.create('Ext.container.Container', {
            cls: 'legend-info-container',
            hidden: true,
            border: false,
            layout: 'card',
            width: this.expandedWidth-this.collapsedWidth,
            region: 'east',
            items: this.contentChildrenContainers
        });

        this.buttonsContainer = Ext.create('Ext.panel.Panel', {
            border: false,
            region: 'center',
            bodyStyle: 'background: transparent;',
            layout: 'vbox',
            items: this.expandButtons
        });

        this.items = [{
            xtype: 'container',
            style: 'background:transparent;',
            layout: 'border',
            border: false,
            items: [this.contentContainer, this.buttonsContainer]
        }];

        this.callParent(arguments);
    },

    expand: function (child) {
        if (this.fireEvent('beforeexpand', this, child)) {
            var tab = child.ownerCt;
            child.toggleButton.toggle(true);
            if (!this.isExpanded) {
                this.setWidth(this.expandedWidth);
                this.contentContainer.show();
                this.setActiveLegendTab(tab);
                this.isExpanded = true;
            } else {
                this.setActiveLegendTab(tab);
            }
            this.fireEvent('expand', this);
        } else {
            if (this.activeLegendTab) {
                this.activeLegendTab.contentContainer.toggleButton.toggle(true);
            }
            child.toggleButton.toggle(false);
        }
    },

    collapse: function () {
        if (this.fireEvent('beforecollapse', this, this.activeLegendTab.contentContainer)) {
            this.setWidth(this.collapsedWidth);
            this.contentContainer.hide();
            Ext.each(this.expandButtons, function (button) {
                button.toggle(false);
            }, this);
            this.isExpanded = false;
            this.activeLegendTab = null;
            this.fireEvent('collapse', this);
        } else if (this.activeLegendTab) {
            this.activeLegendTab.contentContainer.toggleButton.toggle(true);
        }
    },

    setActiveLegendTab: function (tab) {
        if (tab != this.activeLegendTab) {
            this.contentContainer.layout.setActiveItem(tab);
            this.activeLegendTab = tab;
        }
    }
});