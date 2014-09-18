
Ext.define('Arches.widgets.Reportgrid', {
    extend: 'Ext.container.Container',
    alias: 'widget.arches.reportgrid',
    gridModel: '',
    columns: [],
    i18n:{},

    createEntityGraph: function(entity) {
        this.entitygraph = new Arches.data.Entity();
        this.entitygraph.load(this.entity);
        this.assetentitytypeid = this.entitygraph.entitytypeid;
    },

    initComponent: function(){

        this.store = Ext.create('Ext.data.Store', {
            // destroy the store if the grid is destroyed
            autoDestroy: true,
            model: this.gridModel,
            proxy: {
                type: 'memory'
            }
        });

        this.items = [{
            xtype: 'container'
            //tpl: '<div class="sectionHeader">' + this.i18n.title + '</div>',
            //data: this.entity
        },
        {
            xtype: 'gridpanel',
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
        }
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

                        if(nodes.length === 0 && field.altentitytypeids) {
                            for (var j = 0; j < field.altentitytypeids.length; j += 1){
                               nodes = groupnodes[i].findEntitiesByTypeId(field.altentitytypeids[j]); 
                               if(nodes.length === 1){ break };
                            }
                        }

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

});
