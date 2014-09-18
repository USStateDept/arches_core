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

Ext.define('Arches.reportsection.BaseReportSectionGrid', {
    extend: 'Arches.reportsection.BaseReportSection',
    alias: 'form.arches-reportsection-basereportsectiongrid',
    gridModel: '',
    columns: [],

    createEntityGraph: function(entity) {
        this.entitygraph = new Arches.data.Entity();
        this.entitygraph.load(this.entity);
        this.assetentitytypeid = this.entitygraph.entitytypeid;
    },

    initComponent: function(){
 
        this.i18n = Ext.Object.merge({
            header: 'Base Grid Form Header',
            subheader: 'Base Grid Form Subheader',
            gridColumnRelationship: 'Relationship'
        }, this.i18n);

        this.store = Ext.create('Ext.data.Store', {
            // destroy the store if the grid is destroyed
            autoDestroy: true,
            model: this.gridModel,
            proxy: {
                type: 'memory'
            }
        });

        this.grid = Ext.create('Ext.grid.Panel', {
            height: 160,
            store: this.store,
            columns: this.columns,
            dockedItems: [{
                xtype: 'panel',
                ui: 'fgi_panel_gray_transparent',
                height: 28,
                html: this.i18n.title,
                dock: 'top'
            }]
        });

        this.items = [{
            xtype: 'container',
            tpl: '<div class="sectionHeader">' + this.i18n.title + '</div>',
            data: this.entity
        },
        this.grid
        ];

    this.populateGrid();
    this.callParent(arguments); 
    },


    populateGrid: function(){
        //
        if (this.createEntityGraph(this.entity) !== null){
            var model = Ext.create(this.gridModel);

            if(model.recordEntityTypeId === 'ROOT'){
                model.recordEntityTypeId = this.assetentitytypeid;
            }            
            var groupnodes = this.entitygraph.findEntitiesByTypeId(model.recordEntityTypeId);
    
            for(var i = 0; i < groupnodes.length; i++){
                var record = Ext.create(this.store.model.getName());
                record.fields.each(function(field){
                    if(field.isEntity()){
                        var entitytypeid = field.entitytypeid;
                        if (entitytypeid === 'roottype') {
                            entitytypeid = this.assetentitytypeid.split('.')[0] + ' TYPE.E55'
                        }

                        var nodes = groupnodes[i].findEntitiesByTypeId(entitytypeid);
                        if(nodes.length === 1){
                            record.set(field.name, nodes[0].value);
                            record.entities.set(field.name, nodes[0]);                                 
                        }                        
                    }
                }, this);
                record.phantom = true;
                record.modified = {};
                this.store.add(record);
                this.fireEvent('recordadded', record);
            }
        }
    },

    renderConceptColumn: function(value, metaData, record, rowIndex, colIndex) {
        var col = this.columns[colIndex];
        var record = col.store.findRecord('labelid', value);
        var name = '';
        if (record) {
            name = record.get('value');
        }
        return name;
    }
});
