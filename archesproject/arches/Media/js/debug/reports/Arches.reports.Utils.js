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

Ext.define('Arches.reports.Utils', {
    singleton: true,

    objectToArray: function(values){
        var array = [];
        for(var key in values){
            if(values.hasOwnProperty(key)){
                array.push({key: key, value: values[key]});
            }
        }
        return array;
    },
    getEntityTypeIdByName: function(entityTypeName){
        var value = "";
        Ext.each(Arches.i18n.DomainData.EntityTypes, function(item, index, allItems){
            if (item.entitytypename === entityTypeName){
                value = item.entitytypeid;
                return true;
            }
        });
        return value;
    },
    getDomainValue: function(recordid){
        return Arches.i18n.DomainData.LocalizedDisplayValuesObj[recordid];
    },
    hasRelationship: function (values, ruleId) {
        var relationships = this.getRelationshipsByRuleId(values.relationships, ruleId);
        return (relationships.length > 0);
    },
    getRelationshipsByRuleId: function(relationships, ruleId) {
        var matched = [];
        Ext.each(relationships, function(relationship) {
            Ext.each(relationship.ruleid, function (relationshipRuleId) {
                if (relationshipRuleId.pk === ruleId) {
                    matched.push(relationship);
                }
            }, this);
        }, this);
        return matched;
    },
    getRelationshipsByEntityTypeId: function (relationships, entitytypeid) {
        var matched = [];
        Ext.each(relationships, function(relationship) {
            Ext.each(relationship.ruleid, function (relationshipRuleId) {
                if (relationshipRuleId.fields.entitytyperange === entitytypeid) {
                    matched.push(relationship);
                }
            }, this);
        }, this);
        return matched;
    },
    getSingleRelationshipValueByRuleId: function (values, ruleId, fieldName) {
        var relationships = this.getRelationshipsByRuleId(values.relationships, ruleId);
        return this.getNamedValueFromRelationship(relationships[0], fieldName);
    },
    getSingleRelationshipValueByEntityTypeName: function(values, name, fieldName){
        try{
            var entitytypeid = this.getEntityTypeIdByName(name);
            var relationships = this.getRelationshipsByEntityTypeId(values.relationships, entitytypeid);
            if(relationships.length > 0){
                return this.getNamedValueFromRelationship(relationships[0], fieldName);
            }else{
                return 'n/a';
            }
        }catch(e){
            return 'n/a'
        }
    },
    getNamedValueFromRelationship: function (relationship, fieldName) {
        var value = null;
        if (relationship) {
            if(fieldName === 'displayvalue_ldv'){
                value = this.getDomainValue(relationship.entity.fields[fieldName]);
            }else{
                value = relationship.entity.fields[fieldName];
            }
        }
        return value;
    },
    getAllRelationshipsByEntityTypeId: function (entitygraph, entitytypeid) {
        var matched = [];
        var relationships;
        if(entitygraph.relationships){
            relationships = entitygraph.relationships;
        }else{
            relationships = entitygraph;
        }
        Ext.each(relationships, function(relationship) {
            Ext.each(relationship.ruleid, function (relationshipRuleId) {
                if (relationshipRuleId.fields.entitytyperange === entitytypeid) {
                    matched.push(relationship);
                }else{
                    var x = this.getAllRelationshipsByEntityTypeId(relationship.entity, entitytypeid);
                    matched = matched.concat(x);
                }
            }, this);
        }, this);
        return matched;
    }
});