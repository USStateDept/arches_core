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

Ext.namespace('Arches.data.Entity');
Arches.data.Entity = function(){
    return {
        property:'',
        entitytypeid:'',
        entityid:'',
        value:'',
        relatedentities:[
            // contains an array of other entities
        ],

        appendChild: function(entity){
            var parent = this;
            var getParent = function(){
                return parent;
            };
            entity.getParent = getParent;
            this.relatedentities.push(entity);
        },

        traverse: function(func, scope) {
            var ret = [];
            if(scope === undefined){
                ret = func.apply(this, [this]);
            }else{
                ret = func.apply(scope, [this]);  
            }

            if(ret === false){
                return false;
            }
            
            for(var i = 0; i < this.relatedentities.length; i++){
                if(this.relatedentities[i].traverse(func, scope) === false){
                    break;
                }
            }
        },

        findEntityValuesByTypeId: function(entitytypeid){
            var ret = [];
            var entities = this.findEntitiesByTypeId(entitytypeid);
            Ext.each(entities, function(entity){
                ret.push(entity.value);
            });
            return ret;
        },

        findEntitiesByTypeId: function(entitytypeid){
            var ret = [];
            var appendValue = function(entity){
                if(entity.entitytypeid === entitytypeid){
                    ret.push(entity);
                }
            };

            if(this.validEntityTypeId(entitytypeid)){
                this.traverse(appendValue, this);
            }
            return ret;
        },

        delete: function(){
            /*
            Delete the highest parent of this node when I'm the only child and my parent has no value,
            otherwise just delete this node

            never allow anyone to delete the root node from this method
            */

            if(this.getRank() !== 0){
                if(this.getParent().relatedentities.length === 1 && this.getParent().value === ''){
                    this.getParent().delete();
                }
                else{
                    var indexesToRemove = [];
                    for(var i = 0; i < this.getParent().relatedentities.length; i++){
                        if(this.getParent().relatedentities[i].entityid === this.entityid){
                            indexesToRemove.push(i);
                        }
                    }
                    for(var i = 0; i < indexesToRemove.length; i++){
                        this.getParent().relatedentities.splice(indexesToRemove[i],1);
                    }
                }
            }

            return true;
        },

        addRelatedEntity: function(entitytypeid, property, value, entityid){
            var node = new Arches.data.Entity();
            node.property = property;
            node.entitytypeid = entitytypeid;
            node.value = value;
            node.entityid = entityid;
            this.appendChild(node);
            return node;
        },

        equals: function(entitytocompare, strict){
            if(this.entitytypeid === entitytocompare.entitytypeid && this.entityid === entitytocompare.entityid && this.property === entitytocompare.property){
                if(strict){
                    if(this.value === entitytocompare.value){
                        return true;
                    }
                }else{
                    return true;
                }
            }
            return false;
        },

        merge: function(entitytomerge){
            //
            // Merge an entity graph into this instance at the lowest common node
            //
            if(this.equals(entitytomerge)){
                // if the value of each node is not blank then the nodes can't be merged
                // and we simply append entitytomerge node to this parent node
                if(this.value !== '' && entitytomerge.value !== ''){
                    this.getParent().appendChild(entitytomerge);
                }

                // update this.value if it makes sense to do so 
                if(this.value === '' && entitytomerge.value !== ''){
                    this.value = entitytomerge.value;
                }

                var relatedentitiesmerged = [];
                // try to merge any relatedentities of this and entitytomerge 
                for(var i = 0; i < entitytomerge.relatedentities.length; i++){
                    for(var j = 0; j < this.relatedentities.length; j++){
                        if(this.relatedentities[j].equals(entitytomerge.relatedentities[i])){
                            this.relatedentities[j].merge(entitytomerge.relatedentities[i]);
                            relatedentitiesmerged.push(entitytomerge.relatedentities[i]);
                        }
                    }
                }

                // append all entitytomerge.relatedentities that weren't merged above
                var unmergedentities = Ext.Array.difference(entitytomerge.relatedentities, relatedentitiesmerged);
                for(var i = 0; i < unmergedentities.length; i++){
                    this.appendChild(unmergedentities[i]);
                }

            }else{
                this.getParent().appendChild(entitytomerge);
            }
            return this;
        },

        mergeAt: function(entitytomerge, entitytypeid){
            var thisEntities = this.findEntitiesByTypeId(entitytypeid);
            var foundEntities = entitytomerge.findEntitiesByTypeId(entitytypeid);

            if(thisEntities.length === 1 && foundEntities.length === 1){
                for(var i = 0; i < foundEntities[0].relatedentities.length; i++){
                    thisEntities[0].appendChild(foundEntities[0].relatedentities[i]);
                }
            }
            //if you can't find the merge node in 'this' then just merge at Root
            if(thisEntities.length === 0 && foundEntities.length === 1){
                this.mergeAt(entitytomerge,this.entitytypeid);
            }
            return this;
        },

        load: function(rawEntityJson){
            this.property = rawEntityJson.property;
            this.entitytypeid = rawEntityJson.entitytypeid;
            this.entityid = rawEntityJson.entityid;
            this.value = rawEntityJson.value;
            for(var i = 0; i < rawEntityJson.relatedentities.length; i++){
                var relatedEntity = new Arches.data.Entity();
                this.appendChild(relatedEntity.load(rawEntityJson.relatedentities[i]));
            }
            return this;
        },

        validEntityTypeId: function(entitytypeid){
            if(typeof entitytypeid === 'string'){
                if(entitytypeid.indexOf('.') !== -1){
                    return true;
                }
            }
            return false;
        },

        getRank: function(rank){
            // Get the rank of this instance (root is 0)
            if(!rank){
                rank = 0;
            }
            if(this.getParent){
                return this.getParent().getRank(rank+1);
            }
            return rank;
        },

        get_root: function(){
            //Get the root node of this instance
            if (this.getParent)
                return this.getParent().get_root();
            return this;
        },

        getPrimaryDisplayName: function(){
            /*
            Gets the human readable name to display for entity instances
            To be overridden during load 
            */ 

            var PRIMARY_VALUE = Arches.config.App.primaryNameInfo.value;
            var PRIMARY_VALUE_ID = Arches.config.App.primaryNameInfo.id;
            var displayname = 'Unnamed Resource';

            switch (this.entitytypeid){
                case 'PERSON.E21':
                    var names = this.get_root().findEntitiesByTypeId('PERSON_NAME_ASSIGNMENT.E15');
                    displayname = 'Unamed Person'
                    if (names.length > 0) {
                        for (i in names) {
                            if (names[i].relatedentities[4].value === PRIMARY_VALUE || names[i].relatedentities[4].value === PRIMARY_VALUE_ID) {
                                firstname = names[i].findEntityValuesByTypeId('NAME OF PERSON.E82')
                                lastname = names[i].findEntityValuesByTypeId('FAMILY NAME.E82')
                                firstname = firstname.length > 0 ? firstname[0] : '';
                                lastname = lastname.length > 0 ? lastname[0] : '';
                                displayname = firstname + ' ' + lastname; 
                            } 
                        }
                    } 
                    break;
                case 'ORGANIZATION.E74':
                    var names = this.get_root().findEntitiesByTypeId('NAME OF ORGANIZATION.E82');
                    displayname = 'Unamed Organiztion'
                    if (names.length > 0) {
                        Ext.each(names, function(name){
                            displayname = name.value;
                            if (name.relatedentities[0].value === PRIMARY_VALUE || name.relatedentities[0].value === PRIMARY_VALUE_ID){
                                displayname = name.value;
                                return false;
                            }
                        }, this)
                    } 
                    break;
                default:
                    var names = this.get_root().findEntitiesByTypeId('NAME.E41');
                    if (names.length > 0){
                        Ext.each(names, function(name){
                            displayname = name.value;
                            if (name.relatedentities[0].value === PRIMARY_VALUE || name.relatedentities[0].value === PRIMARY_VALUE_ID){
                                displayname = name.value;
                                return false;
                            }
                        }, this)
                    }else{
                        displayname = 'Unnamed Resource';
                    }
                    break;
            }

            return displayname;
        },

        getAlternateDisplayNames: function(){
            /*
            Gets the human readable name to display for entity instances
            To be overridden during load 
            */ 

            var PRIMARY_VALUE = Arches.config.App.primaryNameInfo.value;
            var PRIMARY_VALUE_ID = Arches.config.App.primaryNameInfo.id;
            var displayname = [];

            switch (this.entitytypeid){
                case 'PERSON.E21':
                    var names = this.get_root().findEntitiesByTypeId('PERSON_NAME_ASSIGNMENT.E15');
                    if (names.length > 0) {
                        for (i in names) {
                            if (!(names[i].relatedentities[4].value === PRIMARY_VALUE || names[i].relatedentities[4].value === PRIMARY_VALUE_ID)) {
                                firstname = names[i].findEntityValuesByTypeId('NAME OF PERSON.E82')
                                lastname = names[i].findEntityValuesByTypeId('FAMILY NAME.E82')
                                firstname = firstname.length > 0 ? firstname[0] : '';
                                lastname = lastname.length > 0 ? lastname[0] : '';
                                displayname.push(firstname + ' ' + lastname); 
                            } 
                        }
                    } 
                    break;
                case 'ORGANIZATION.E74':
                    var names = this.get_root().findEntitiesByTypeId('NAME OF ORGANIZATION.E82');
                    if (names.length > 0) {
                        Ext.each(names, function(name){
                            if (!(name.relatedentities[0].value === PRIMARY_VALUE || name.relatedentities[0].value === PRIMARY_VALUE_ID)){
                                displayname.push(name.value);
                            }
                        }, this)
                    } 
                    break;
                default:
                    var names = this.get_root().findEntitiesByTypeId('NAME.E41');
                    if (names.length > 0){
                        Ext.each(names, function(name){
                            if (!(name.relatedentities[0].value === PRIMARY_VALUE || name.relatedentities[0].value === PRIMARY_VALUE_ID)){
                                displayname.push(name.value);
                            }
                        }, this)
                    }
                    break;
            }

            return displayname.length === 0 ? ['n/a'] : displayname;
        },

        getCreatedDate: function(){
            var date = 'N/A';

            dates = this.get_root().findEntitiesByTypeId('DATE OF COMPILATION.E50');
            if (dates.length > 0){
                date = Ext.util.Format.date(dates[0].value,'Y-m-d H:i:s');
            }
            return date;
        },

        getDateOfLastUpdate: function(){
            var date = 'N/A';

            dates = this.get_root().findEntitiesByTypeId('DATE OF LAST UPDATE.E50');
            if (dates.length > 0){
                date = Ext.util.Format.date(dates[0].value,'Y-m-d H:i:s');
            }
            return date;
        }

    }
};
