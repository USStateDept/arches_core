Ext.define('Arches.models.ConceptTree', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'id'},
        {name: 'relationshiptype'},
        {name: 'displaylabel', type: 'string'},
        {name: 'selectable', type: 'boolean', defaultValue: true}
    ],
    associations: [
        {type: 'hasMany', model: 'Arches.models.ConceptLabel', name: 'labels'},
        {type: 'hasMany', model: 'Arches.models.ConceptMetadata', name: 'metadata'},
        {type: 'hasMany', model: 'Arches.models.ConceptTree', name: 'subconcepts'},
    ],
    getPreferredTerms: function(language){
        var ret = [];
        var associatedData = this.getAssociatedData();
        if('labelsStore' in this){
            this.labelsStore.each(function(record){
                if(record.get('type') === 'prefLabel'){
                    if(typeof language === 'string' && language !== ''){
                        if(language === record.get('language')){
                            ret.push(record);
                        }
                    }else{
                        ret.push(record);
                    }
                }
            })
        }
        return ret;
    },
    getMetadata: function(fieldname){
        var ret = '';
        var associatedData = this.getAssociatedData();
        if('metadata' in associatedData){
            for(var i in associatedData.metadata){
                if(associatedData.metadata[i].type === fieldname){
                    ret = associatedData.metadata[i].value;
                    break;
                }
            }
        }
        return ret;
    }
});

Ext.define('Arches.models.ConceptLabel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'id'},
        {name: 'language'},
        {name: 'type'},
        {name: 'value'}
    ]
});

Ext.define('Arches.models.ConceptMetadata', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'id'},
        {name: 'datatype'},
        {name: 'type'},
        {name: 'value'}
    ]
});

Ext.define('Arches.models.ConceptList', {
    extend: 'Ext.data.Model',
    idProperty: 'labelid',
    fields: [
        {name: 'rootentitytypeid', type: 'string'},
        {name: 'conceptid', type: 'string'},
        {name: 'labelid', type: 'string'},
        {name: 'type', type: 'string'},
        {name: 'value', type: 'string'},
        {name: 'sortorder', type: 'int'}
    ],
    associations: [
        {type: 'hasMany', model: 'Arches.models.ConceptMetadata', name: 'metadata'}
    ],
    getMetadata: function(fieldname){
        var ret = '';
        var associatedData = this.getAssociatedData();
        if('metadata' in associatedData){
            for(var i in associatedData.metadata){
                if(associatedData.metadata[i].type === fieldname){
                    ret = associatedData.metadata[i].value;
                    break;
                }
            }
        }
        return ret;
    }
});

Ext.define('Arches.data.reader.ConceptTreeJson',{
    extend: 'Ext.data.reader.Json',
    alias : 'reader.concepttreejson',

    getResponseData: function(response) {
        var data = this.callParent(arguments);
        var ret = [];
        Ext.each(data.hits.hits, function(data){
            ret = ret.concat(this.convertForTree(data._source));
        }, this);
        return ret;
    },
    
    convertForTree: function(data){
        Ext.each(data, function(data){
            data.leaf = false;
            data.iconCls = 'task-folder';
            if(data.subconcepts.length === 0){
                data.leaf = true;
            }
            Ext.each(data.labels, function(label){
                if(label.type === 'prefLabel' && label.language === 'en-us'){
                    data.displaylabel = label.value;
                    return false;
                }
            },this);
            Ext.each(data.subconcepts, function(concept){
                this.convertForTree(concept);
            },this);
        }, this);
        return data;
    }
});

Ext.define('Arches.data.reader.ConceptListJson',{
    extend: 'Ext.data.reader.Json',
    alias : 'reader.conceptlistjson',

    getResponseData: function(response) {
        var data = this.callParent(arguments);
        var ret = [];
        var injectRootEntityTypeId = false;
        if (data.hits.hits.length > 1){
			injectRootEntityTypeId = true;
        }
        Ext.each(data.hits.hits, function(data){
            if(injectRootEntityTypeId){
                ret = ret.concat(this.convertForList(data._source, [], data._type));
            }else{
                ret = ret.concat(this.convertForList(data._source, [], ''));
            }
        }, this);
        return ret;
    },
    
    convertForList: function(data, ret, rootentitytypeid){
		ret = ret || [];
        Ext.each(data, function(data){
            var concept = {};
            Ext.each(data.labels, function(label){
                concept = {};
                concept.rootentitytypeid = rootentitytypeid;
                concept.conceptid = data.id;
                concept.labelid = label.id;
                concept.type = label.type;
                concept.value = label.value;
                concept.metadata = data.metadata;
                concept.relationshiptype = data.relationshiptype;
                Ext.each(data.metadata, function(metadata){
                    if(metadata.type === 'sortorder'){
                        concept.sortorder = metadata.value;
                        return false;
                    }
                },this);
                ret.push(concept);
            },this);

            Ext.each(data.subconcepts, function(concept){
                this.convertForList(concept, ret, rootentitytypeid);
            },this);

        }, this);
        return ret;
    }
});