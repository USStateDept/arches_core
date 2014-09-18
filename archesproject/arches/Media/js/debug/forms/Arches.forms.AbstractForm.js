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

Ext.define('Arches.forms.AbstractForm', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.arches-forms-abstractform',

    title: '',
    ui: 'fgi_panel_white',
    componentCls: 'form',

    initComponent: function (options) {
        this.i18n = Ext.Object.merge({
            header: 'Header',
            subheader: 'subheader'
        }, this.i18n);
        
        if (this.i18n.header !== '') {
            this.dockedItems = [{
                xtype: 'container',
                layout: {
                    type: 'hbox',
                    align: 'top'
                },
                componentCls: 'headerwrapper',
                dock: 'top',
                items:[
                //     {
                //         xtype: 'button',
                //         iconCls: 'glyph-info icon-small',
                //         ui: 'fgi_button_white'
                //     },
                    {
                        xtype: 'component',
                        // style: 'padding-left: 10px;',
                        componentCls: 'header',
                        html: this.i18n.header
                    },{
                        xtype: 'component',
                        style: 'padding-left: 10px;',
                        componentCls: 'subheader',
                        html: this.i18n.subheader
                }]
            }];
        }

        this.callParent(arguments);
    },

    onChange: function () {
        this.fireEvent('change', this);
    },

    isValid: function () {
        return { valid: true, msg: '', form: this };
    },

    toJson: function () {
        // to be implemented by subclasses
        return null;
    }
});