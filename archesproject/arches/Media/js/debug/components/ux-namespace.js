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

Ext.namespace("Ext.ux");
Ext.ux.comboBoxRenderer = function (value, metaData, record, row, col, store, gridView) {
    var combo = this.columns[col].getEditor();
    var store = combo.store;

    var idx = store.find(combo.valueField, value);
    var rec = store.getAt(idx);
    return (rec == null ? '' : rec.get(combo.displayField));
};

Ext.override(Ext.grid.plugin.RowEditing, {
    cancelEdit: function () {
        var me = this;

        if (me.editing) {
            me.getEditor().cancelEdit();
            me.callParent(arguments);

            this.fireEvent('canceledit', this.context);
        }
    }
});

Ext.override(Ext.data.Store, {
    // added loadRawData straight from Ext 4.0.7
    loadRawData : function(data, append) {
        var me      = this,
            result  = me.proxy.reader.read(data),
            records = result.records;

        if (result.success) {
            me.loadRecords(records, { addRecords: append });
            me.fireEvent('load', me, records, true);
        }
    }
});

Ext.override(Ext.tree.Panel, {
    /**
     * Expand the tree to the path of a particular node.
     * @param {String} path The path to expand. The path should include a leading separator.
     * @param {String} field (optional) The field to get the data from. Defaults to the model idProperty.
     * @param {String} separator (optional) A separator to use. Defaults to `'/'`.
     * @param {Function} callback (optional) A function to execute when the expand finishes. The callback will be called with
     * (success, lastNode) where success is if the expand was successful and lastNode is the last node that was expanded.
     * @param {Object} scope (optional) The scope of the callback function
     */
    expandPath: function(path, field, separator, callback, scope) {
        var me = this,
            current = me.getRootNode(),
            index = 1,
            view = me.getView(),
            keys,
            expander;

        field = field || me.getRootNode().idProperty;
        separator = separator || '/';

        if (Ext.isEmpty(path)) {
            Ext.callback(callback, scope || me, [false, null]);
            return;
        }

        keys = path.split(separator);
        if (current.get(field) != keys[1]) {
            // invalid root
            Ext.callback(callback, scope || me, [false, current]);
            return;
        }

        expander = function(){
            if (++index === keys.length) {
                Ext.callback(callback, scope || me, [true, current]);
                return;
            }
            var node = current.findChild(field, keys[index]);
            if (!node) {
                Ext.callback(callback, scope || me, [false, current]);
                return;
            }
            current = node;
            current.expand(false, expander);
        };
        current.expand(false, expander);
    }
});

//Ext.grid.plugin.RowEditing.superclass.addEvents('canceledit');