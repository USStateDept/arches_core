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

/** 
* @class Arches.models.Layer
* @extends Ext.data.Model
* @requires Ext 4.0.0
* <p>represents a layer</p>
*/
Ext.define('Arches.models.LayerGroup', {
    extend: 'Ext.data.Model',
    fields: [
        { name: 'id', type: 'int', useNull: true },
        { name: 'name', type: 'string' }
    ],
    hasMany: {
        model: 'Arches.models.Layer',
        name: 'layers'
    },
    idProperty: 'id'
});

Ext.define('Arches.models.Layer', {
    extend: 'Ext.data.Model',
    fields: [
        { name: 'id', type: 'int', useNull: true },
        { name: 'name', type: 'string'},
        { name: 'layergroup', type: 'string'},
        { name: 'sortorder', type: 'number', defaultValue: 100000 },
        { name: 'active', type: 'boolean', defaultValue: true },
        { name: 'onMap', type: 'boolean', defaultValue: false },
        { name: 'selectable', type: 'boolean', defaultValue: false },
        { name: 'icon', type: 'string' }, // CSS class name
        { name: 'symbology', type: 'string' }, // CSS class name
        { name: 'thumbnail', type: 'string', convert: function(value) {
                if (!value) {
                    value = 'unknown';
                }
                return value;
            }
        },
        { name: 'description', type: 'string' },
        { name: 'layer', convert: function (v) {
            if (typeof v === 'string'){
                try{
                    var factory = new Function(v);
                    return factory();
                }catch(err){
                    console.log('LAYER COULD NOT BE CREATED: ' + v)
                    return null;
                }
            } else {
                return v;
            }
        } } // OpenLayers layer instance
    ],
    idProperty: 'id',
    associations: [{
        type: 'belongsTo',
        model: 'Arches.models.LayerGroup',
        name: 'layerGroup'
    }]
});

