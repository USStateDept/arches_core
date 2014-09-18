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

Ext.define('Arches.widgets.ClusterList', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.arches-widgets-clusterlist',
    
    ui: 'fgi_panel_gray',
    layout: 'border',
    frame: true,
    
    initComponent: function () {
        this.addEvents({
            'itemclick': true
        });

        this.headerContainer = Ext.create('Ext.container.Container', {
            region: 'north',
            height: 50,
            tpl: new Ext.XTemplate(Arches.config.Tpls.clusterListHeader, Arches.config.Tpls.functions),
        });

        this.store = Ext.create('Ext.data.Store', {
            model:'Arches.models.ClusterMember',
            proxy:{
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'cluster'
                }
            }
        });

        this.list = Ext.create('Ext.view.BoundList', {
            region: 'center',
            autoScroll: true,
            store: this.store,
            tpl: new Ext.XTemplate(
                    '<ul><tpl for=".">',
                        '<li role="option" class="x-boundlist-item">' + Arches.config.Tpls.clusterList + '</li>',
                    '</tpl></ul>',
                    Arches.config.Tpls.functions
                ),
            style: 'background: white;border-width: 1px; border-color: #cacaca;',
            listeners:{
                'selectionchange': function (view, selections, eOpts) {
                    if (selections.length > 0) {
                        this.list.getSelectionModel().deselectAll(true);
                    }
                },
                'itemclick': function (view, record, item, index, e) {
                    this.fireEvent('itemclick', view, record, item, index, e);
                    this.list.getSelectionModel().deselectAll(true);
                },
                scope:this
            }
        })

        this.items = [
            this.headerContainer,
            this.list
        ];

        this.callParent(arguments);
    },

    setFeature: function (feature) {
        this.headerContainer.update(feature.attributes);

        this.store.removeAll();
        var records = [];
        Ext.each(feature.cluster, function(member) {
            records.push(Ext.create('Arches.models.ClusterMember', {
                entityTypeId: member.attributes.entitytypeid,
                entityId: member.attributes.entityid,
                primaryname: member.attributes.primaryname,
                geometry: member.geometry
            }));
        }, this);
        this.store.add(records);
    }
});