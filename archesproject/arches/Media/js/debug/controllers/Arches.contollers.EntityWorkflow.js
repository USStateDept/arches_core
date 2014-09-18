Ext.define('Arches.contollers.EntityWorkflow',{
	extend: 'Ext.container.Container',

	layout: 'card',
    width: 900,
    entitytypeid: null,

	_rawgraph: null,
    entitygraph: null,
    workflowRunning: false,
    editsPending: false,
    currentForms: [],
    stores: {},

    initComponent: function(){
    	this.addEvents({
    		'end': false
    	});

    	this.formFactory = Ext.create('Arches.factories.FormContainer');

		this.entityTypeSelector = Ext.create('Arches.widgets.EntityTypeSelector');

		this.saveButton = Ext.create('Arches.formcomponents.Buttons',{
			text: 'Save',
			iconCls: 'glyph-action', 
			handler: function(){
        		this.save();
			},
			scope: this,
			disabled: true
		});

		this.formPanels = Ext.create('Ext.panel.Panel',{
			layout: 'fit',
			border: false,
			baseCls: 'x-plain',
			dockedItems:{
				xtype: 'panel',
				ui: 'fgi_panel_gray_transparent',
				dock: 'bottom',
	            style: 'padding: 5px;',
	            height: 42,
	            layout: {
	                type: 'hbox',
	                align: 'stretch',
	                pack: 'end'
	            },
            	items:[
					Ext.create('Arches.formcomponents.Buttons',{
						text: 'Cancel',
						iconCls: 'glyph-no', 
						handler: function(){
							this.up().up().fireEvent('cancelclicked');
						}
					}),
					this.saveButton
				]
			}
		});

		this.deleteButton = Ext.create('Ext.button.Button', {
            ui: 'fgi_button_white',
            text: ' ',
            scale: 'medium',
            iconAlign: 'top',
            iconCls: 'glyph-trash',
            handler: function (button) {
            	this.deleteEntity(this.entitygraph, true);
            },
            scope: this,
            width: 46,
            height: 34,
            style: 'margin: 2px;'         
        });

        this.recordInfoContainer = Ext.create('Ext.container.Container', {
        	flex: 1,
        	tpl: '<div>Arches id: {archesId}</div>' +
            	'<div>Record created: {createDate}</div>' +
            	'<div>Last update: {updateDate}</div>',
            data: {
            	archesId: 'N/A',
            	createDate: 'N/A',
            	updateDate: 'N/A'
            }
        });

        this.infoThemeSelector = Ext.create('Arches.widgets.InfoThemeSelector');
        this.infoThemeSelectorContainer = Ext.create('Ext.container.Container', {
            tabTitle: 'Information',
            tabIconCls: 'glyph-tower',
            layout: {
            	type:'vbox',
            	align: 'stretch'
            },
            style: 'background-color:white;',
            items: [
            	Ext.create('Ext.panel.Panel', {
		            layout: {
		                type: 'hbox',
		                align: 'middle'
		            },
		            height: 66,
		            ui: 'fgi_panel_gray_transparent',
		            items: [this.recordInfoContainer,{
		                xtype: 'button',
		                ui: 'fgi_button_white',
		                text: ' ',
		                scale: 'medium',
		                iconAlign: 'top',
		                iconCls: 'glyph-arrowwest',
		                handler: function (button) {
		                	this.endWorkflow();
		                },
		                scope: this,
		                width: 46,
		                height: 34,
		                style: 'margin: 2px;'         
		            }, this.deleteButton]
            	}),
                Ext.create('Ext.container.Container', {
                    html: '<div class="label" style="padding:0px;">Click on a theme to edit resource</div>',
                    height: 24,
                    cls: 'info-themes-header'
                }),
                this.infoThemeSelector
            ],
            listeners: {
	            'activate': function () {
	            	if (this.entitygraph) {
	            		this.deleteButton.enable();
	            	} else {
	            		this.deleteButton.disable();
	            	}
	            	this.updateRecordInfoDisplay(Arches.config.Tpls.functions.getEntityTypeNameFromId(this.entitytypeid));
	            },
	            scope: this
            }
        });

		this.items = [	
			this.entityTypeSelector,
			this.infoThemeSelectorContainer,
			this.formPanels
		];

        this.callParent(arguments);

        this.applyListeners();

    },

    applyListeners: function() {
    	this.entityTypeSelector.on({
    		'typeselected': function(view, record){
    			this.startWorkflow(record.get('entitytypeid'));
    		},
            scope: this
    	});

    	this.formPanels.on({
            'cancelclicked': function(){
				this.cancelEdits();
            },
            scope: this
    	});

    	this.infoThemeSelector.on({
    		'infothemeselected': function(view, selections){
				this.formPanels.removeAll();
				var forms = this.formFactory.getFromFormsArray(selections[0].get('forms'), this);
                this.currentForms = forms.items.items;
				forms.on({
	    			'backclicked': function () {
	    				if (this.editsPending) {
		                    Ext.Msg.show({
		                         title: 'Unsaved Changes',
		                         msg: 'You have unsaved changes.  Would you like to save these changes before going back?',
		                         buttons: Ext.Msg.YESNOCANCEL,
		                         fn: function (btnId) {
		                            if (btnId === 'yes') {
		                                this.save();
		                            } else if (btnId === 'no') {
										this.clearPendingEdits();
										this.backToInformationThemes();
		                            }
		                         },
		                         scope: this
		                    });
		                } else {
		                	this.backToInformationThemes();
		                }
	    			},
	    			'change': function () {
	    				this.editsPending = true;
	    				this.saveButton.enable();
	    			},
	    			scope: this
	    		});
				this.formPanels.add(forms);
				this.getLayout().next();
            },
            scope: this
    	});
    },

    updateRecordInfoDisplay: function(subtitle) {
		var archesId = 'N/A';

        // this is somewhat of a hack until we can implement the workflow to 
        // always assume that this.entitygraph is initialized to something
        // and not rely on sniffing for this.entitygraph === null to test for a valid entitygraph
        var temp = new Arches.data.Entity();
        temp.entitytypeid = this.entitytypeid;
        var primaryName = temp.getPrimaryDisplayName();
        var createDate = temp.getCreatedDate();
        var updateDate = temp.getDateOfLastUpdate();        
		
        if (this.entitygraph) {
			archesId = this.entitygraph.entityid;
            primaryName = this.entitygraph.getPrimaryDisplayName();
            createDate = this.entitygraph.getCreatedDate();
            updateDate = this.entitygraph.getDateOfLastUpdate();
		}

    	this.recordInfoContainer.update({
        	archesId: archesId,
        	createDate: createDate,
        	updateDate: updateDate
        });
        
        this.ownerCt.updateTitle(
            primaryName,
            subtitle,
            this.entitytypeid);
    },

    addNewEntity: function () {
    	this.getLayout().setActiveItem(this.entityTypeSelector);
    },

    loadEntity: function(entityid){
    	var loadMask = new Ext.LoadMask(Ext.getBody(), {msg:"Loading entity for edit..."});
    	loadMask.show();
		Ext.Ajax.request({
			url: Arches.config.Urls.entity + entityid,
			success: function(response, opts){
				this.createEntityGraph(response.responseText);
		        this.startWorkflow(this.assetentitytypeid);
		        loadMask.hide();	
			},
			failure: function () {
				loadMask.hide();
				this.endWorkflow();
				Ext.Msg.alert('Something went wrong', 'Entity failed to load for edit.  Please contact your system administrator if this continues to happen.');
			},
			scope:this
		});
    },

    createEntityGraph: function(entityGraphString) {
		this._rawgraph = Ext.decode(entityGraphString);
   		this.entitygraph = new Arches.data.Entity();
        this.entitygraph.load(this._rawgraph);
        this.assetentitytypeid = this.entitygraph.entitytypeid;
    },

    loadEntitySchema: function(entitytypeid){
		Ext.Ajax.request({
			url: Arches.config.Urls.entitytypes + entitytypeid,
			method: 'GET',
			params: {
				f: 'json'
			},
			success: function(response, opts){
				this.entityschema = Ext.decode(response.responseText);
			},
			scope:this
		});
    },

    clearPendingEdits: function () {
	    for(var storename in this.stores){
	        this.stores[storename].removeAll();
	        delete this.stores[storename];
	    };
	    this.saveButton.disable();
		this.editsPending = false;

    	this.fireEvent('pendingeditscleared');
    },

    backToInformationThemes: function () {
    	this.clearPendingEdits();
		this.getLayout().setActiveItem(this.infoThemeSelectorContainer);
    	// if (this.entitygraph && this.entitygraph.entityid) {
    	// 	this.loadEntity(this.entitygraph.entityid);
    	// }
    },

    save: function(){
        var invalidForms = [];
        var _entitygraphPreSave = Ext.clone(this.entitygraph);

        Ext.each(this.currentForms, function (form) {
            var formValidity = form.isValid();
            if (!formValidity.valid) {
                invalidForms.push(formValidity)
            }
        }, this);

        if (invalidForms.length > 0) {
            this.formPanels.items.items[0].getLayout().setActiveItem(invalidForms[0].form);
            Ext.Msg.alert('Forms Invalid', invalidForms[0].msg);
        } else {
        	var loadMask = new Ext.LoadMask(Ext.getBody(), {msg:"Saving resource..."});
    		loadMask.show();
            
            var recordsToInsert = [];
            var recordsToUpdate = [];
            var recordsToDelete = [];

            for(var storename in this.stores){
                store = this.stores[storename];
                recordsToInsert = recordsToInsert.concat(store.getNewRecords());
                recordsToUpdate = recordsToUpdate.concat(store.getUpdatedRecords());
                recordsToDelete = recordsToDelete.concat(store.getRemovedRecords());
            }

            var entitiesToSave = [].concat(this.getNewEntities(recordsToInsert), this.getUpdatedEntities(recordsToUpdate));
            var entitiesToDelete = this.getDeletedEntities(recordsToDelete);

            var savecallback = function(options, success, response){
            	if(success){
            		// var entityid = Ext.JSON.decode(response.responseText).entityid;
            		// this.entitygraph.entityid = entityid;
                    this.createEntityGraph(response.responseText);
    			    this.editsPending = false;
    			    loadMask.hide();
    			    this.backToInformationThemes();
    			    this.fireEvent('dataupdated');
            	}else{
            		loadMask.hide();
            		Ext.Msg.alert('Problem Saving','There was a problem saving your data.  Please try again later.  If the problem persists, please contact your system administrator.');
            	    this.entitygraph = Ext.clone(_entitygraphPreSave);
                }
    	    };

            this.saveEntity(this.entitygraph, savecallback);
        }
    },

    deleteEntity: function (entitiesToDelete, confirm, callback) {
    	if(!Ext.isArray(entitiesToDelete)){
    		entitiesToDelete = [entitiesToDelete];
    	}

        var postbody = JSON.parse(JSON.stringify(entitiesToDelete));

    	if(confirm){
	        Ext.Msg.confirm('Delete Entity',
	            'Are you sure you\'d like to delete this entity?',
	            function (btn) {
	                if (btn === 'yes') {
        		    	var loadMask = new Ext.LoadMask(Ext.getBody(), {msg:"Deleting resource..."});
						loadMask.show();
                        var deletecallback = function(options, success, response){
                        	loadMask.hide();
                        	if(success){
                        		this.fireEvent('dataupdated');	        
                				this.endWorkflow();
                        	}else{
                	            Ext.Msg.alert('Problem Deleting','There was a problem deleting this resource.  Please try again later.  If the problem persists, please contact your system administrator.');
                        	}
                	    };
	                    this.deleteEntity(entitiesToDelete, false, deletecallback);
	                }
	            },
	            this
	        );    		
    	}else{
	        Ext.Ajax.request({
			    url: Arches.config.Urls.entity,
			    method: 'DELETE',
			    jsonData: entitiesToDelete,
			    callback: callback,
			    scope: this
			});
    	}
    },

    saveEntity: function (entitiesToSave, callback) {
        var postbody = JSON.parse(JSON.stringify(entitiesToSave));

        Ext.Ajax.request({
		    url: Arches.config.Urls.entity,
		    method: 'POST',
		    jsonData: postbody,
		    callback: callback,
		    scope: this
		});	
    },

    cancelEdits: function () {
    	if (this.editsPending) {
	        Ext.Msg.confirm('Cancel Edits',
	            'Are you sure you\'d like to cancel without saving?',
	            function (btn) {
	                if (btn === 'yes') {
	                    this.clearPendingEdits();
	                    this.backToInformationThemes();
	                }
	            },
	            this
	        );
	    } else {
	    	this.backToInformationThemes();
	    }
    },

    startWorkflow: function(entitytypeid){
        // this should only be called once to initialize the workflow, but
        // instead it's being called everytime the entity is saved
		this.loadEntitySchema(entitytypeid);
		this.entitytypeid = entitytypeid;
        this.assetentitytypeid = entitytypeid;
        this.infoThemeSelector.setEntityType(this.assetentitytypeid);
		this.getLayout().setActiveItem(this.infoThemeSelectorContainer);
		this.workflowRunning = true;
		this.fireEvent('start');
    },

    endWorkflow: function(delay){
		this.clearPendingEdits();

		Ext.apply(this, {
			entitytypeid: null,
			_rawgraph: null,
			entitygraph: null,
			workflowRunning: false,
			editsPending: false
		});

		this.fireEvent('end');
    },

    getUpdatedEntities: function(records){
    	var ret = [];
        Ext.each(records, function(record, index, records){
            Ext.each(record.fields.items, function(field, index, allFields){
                if(record.isModified(field.name)){
	                if(record.entities.get(field.name)){
	                	var entity = record.entities.get(field.name);
	                	entity.value = record.get(field.name); 
		                ret.push(entity);
		            }
		        }
            }, this);
        },this);
        return ret;
    },

    getNewEntities: function(records){
        var ret = [];
        Ext.each(records, function(record, index, records){
            var mappings = [];
            var entitytypeid = '';
            Ext.each(record.fields.items, function(field, index, allFields){
                if(field.isEntity()){
                	entitytypeid = field.entitytypeid;
                	if (entitytypeid === 'roottype') {
                		entitytypeid = this.assetentitytypeid.split('.')[0] + ' TYPE.E55'
                	}
                    var mappingsteps = this.entityschema[this.assetentitytypeid][entitytypeid]['steps'];
                    var rootentity = new Arches.data.Entity();
                    var currententity = rootentity;
                    currententity.entitytypeid = mappingsteps[0].entitytypedomain;  
                    Ext.each(mappingsteps, function(mappingstep, index, allSteps){
                        var value = '';
                        if (mappingstep.entitytyperange === entitytypeid){
                            value = record.get(field.name); 
                        }
                        currententity = currententity.addRelatedEntity(mappingstep.entitytyperange, mappingstep.propertyid, value, '');
                    },this);
                    mappings.push(rootentity);                    
                }
            }, this);
            //merge all the mappings together  

            var mappinggraph = mappings[0];
            for(var i = 1; i < mappings.length; i++){
                mappinggraph.merge(mappings[i]);
            }

            if(this.entitygraph === null){
                this.entitygraph = mappinggraph;
            }else{
            	nodetypetomergeat = this.entityschema[this.assetentitytypeid][entitytypeid]['mergenodeid'];
                this.entitygraph.mergeAt(mappinggraph, nodetypetomergeat);
            }
            
            ret.push(mappinggraph);

        },this);

        return ret;
    },

    getDeletedEntities: function(records){
    	var ret = [];
        Ext.each(records, function(record, index, records){
            Ext.each(record.fields.items, function(field, index, allFields){
                if(record.entities.get(field.name)){
                	var entity = record.entities.get(field.name);
	                ret.push(entity);
                    entity.delete();
	            }
            }, this);
        },this);
        return ret;
    }
});