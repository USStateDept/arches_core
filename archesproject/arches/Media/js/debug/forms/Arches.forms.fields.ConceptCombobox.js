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

Ext.define('Arches.forms.fields.ConceptCombobox', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.conceptcombobox',

    queryMode: 'local',
    displayField: 'value',
    valueField: 'labelid',
    forceSelection: true,
    triggerAction: 'query',
    conceptEntityId: null,
    resourceEntityId: null,
    gridform: null,
    showMask: true,
    rawConceptData: null,
    viewTreeRecord: null,

    initComponent: function () {
        this.viewTreeRecordId = Ext.id();
        this.viewTreeRecord = Ext.create('Arches.models.ConceptList');
        this.viewTreeRecord.set('order', -9999999);
        this.viewTreeRecord.set('labelid', this.viewTreeRecordId);
        this.viewTreeRecord.set('value', '<span style="font-weight:bold;">View Concept Tree</span>');

        this.listConfig = {
            itemTpl: new Ext.XTemplate(
                '<tpl if="rootentitytypeid === &quot;&quot;">{value}</tpl>',
                '<tpl if="rootentitytypeid !== &quot;&quot;"><div>{value}</div><div style="padding-left:8px;font-size:11px; color:gray;">{[this.getEntityTypeNameFromId(values.rootentitytypeid)]}</div></tpl>',
                Arches.config.Tpls.functions
            )
        };

        this.store = Ext.create('Ext.data.Store', {
            model: 'Arches.models.ConceptList',
            proxy: {
                type: 'memory',
                reader: {
                    type: 'conceptlistjson',
                    root: 'hits.hits'
                }
            },
            sorters: [{
                property : 'sortorder',
                direction: 'ASC'
            },{
                property : 'value',
                direction: 'ASC'
            }]
        });

        this.getConceptData();

        // override hidden method to prevent selection
        this.onListSelectionChange = function(list, selectedRecords) {
            if (selectedRecords.length === 1 && selectedRecords[0].get('labelid') === this.viewTreeRecordId) {
                this.viewConceptTree();
            }else{
                var me = this,
                    isMulti = me.multiSelect,
                    hasRecords = selectedRecords.length > 0;
                // Only react to selection if it is not called from setValue, and if our list is
                // expanded (ignores changes to the selection model triggered elsewhere)
                if (!me.ignoreSelection && me.isExpanded) {
                    if (!isMulti) {
                        Ext.defer(me.collapse, 1, me);
                    }
                    /*
                     * Only set the value here if we're in multi selection mode or we have
                     * a selection. Otherwise setValue will be called with an empty value
                     * which will cause the change event to fire twice.
                     */
                    if (isMulti || hasRecords) {
                        me.setValue(selectedRecords, false);
                    }
                    if (hasRecords) {
                        me.fireEvent('select', me, selectedRecords);
                    }
                    me.inputEl.focus();
                }
            }
        };

        this.callParent(arguments);
    },

    getConceptData: function () {
        if (this.showMask) {
            this.mask = new Ext.LoadMask(Ext.getBody(), {msg:"loading form data..."});
            this.mask.show();
        }

        this.store.removeAll();

        this.data = Ext.Ajax.request({
            url: Arches.config.Urls.concepts + this.conceptEntityId,
            method: 'GET',
            success: function(response){
                this.rawConceptData = response;
                this.store.loadRawData(response);

                if (this.gridform) {
                    this.gridform.grid.getView().refresh();
                }
                if (this.showMask) {
                    this.mask.hide();
                }

                this.store.add(this.viewTreeRecord);
                this.store.sort();
                
                this.fireEvent('afterload', this);
            },
            scope: this
        });
    },

    viewConceptTree: function () {
        var title = 'Concept Viewer',
            editorRecord = null,
            editorColumn = null;

        if (this.gridform) {
            editorRecord = this.gridform.editor.getActiveRecord();
            editorColumn = this.gridform.editor.getActiveColumn();
        }

        if (this.resourceEntityId) {
            title = Arches.config.Tpls.functions.getEntityTypeNameFromId(this.resourceEntityId);
        }

        this.treePanel = Ext.create('Arches.widgets.ConceptViewer',{
            rawConceptData: this.rawConceptData,
            conceptEntityId: this.conceptEntityId,
            titleConfig: {
                entitytypeid: this.resourceEntityId,
                title: title,
                subtitle: Arches.config.Tpls.functions.getEntityTypeNameFromId(this.conceptEntityId) + ' Thesaurus'
            },
            listeners:{
                'termselected': function(labelid){
                    this.store.clearFilter();
                    var selectedRecord = this.store.findRecord('labelid', labelid);
                    
                    if (editorRecord) {
                        editorRecord.set(editorColumn.dataIndex, labelid);
                    } else {
                        this.setValue([selectedRecord], false);
                    }

                    this.fireEvent('select', this, [selectedRecord], {editorRecord: editorRecord});
                    
                    this.treePanel.hide();
                },
                scope:this
            }
        });
        this.treePanel.show();
    },

    setConceptId: function (conceptId) {
        this.conceptEntityId = conceptId;

        this.getConceptData();
    },

    doQuery: function(queryString, forceAll, rawQuery) {
        queryString = queryString || '';

        // store in object and pass by reference in 'beforequery'
        // so that client code can modify values.
        var me = this,
            qe = {
                query: queryString,
                forceAll: forceAll,
                combo: me,
                cancel: false
            },
            store = me.store,
            isLocalMode = me.queryMode === 'local';

        if (me.fireEvent('beforequery', qe) === false || qe.cancel) {
            return false;
        }

        // get back out possibly modified values
        queryString = qe.query;
        forceAll = qe.forceAll;

        // query permitted to run
        if (forceAll || (queryString.length >= me.minChars)) {
            // expand before starting query so LoadMask can position itself correctly
            me.expand();

            // make sure they aren't querying the same thing
            if (!me.queryCaching || me.lastQuery !== queryString) {
                me.lastQuery = queryString;

                if (isLocalMode) {
                    // forceAll means no filtering - show whole dataset.
                    if (forceAll) {
                        store.clearFilter();
                    } else {
                        // Clear filter, but supress event so that the BoundList is not immediately updated.
                        store.clearFilter(true);
                        //store.filter(me.displayField, queryString);
                        store.filter([
                            {
                                filterFn: function(item) {
                                    if (item.get('labelid') === me.viewTreeRecordId) {
                                        return true;
                                    }
                                    return item.get(me.displayField).toLowerCase().substring(0, queryString.length) === queryString.toLowerCase();
                                }
                            }
                        ]);
                    }
                } else {
                    // Set flag for onLoad handling to know how the Store was loaded
                    me.rawQuery = rawQuery;

                    // In queryMode: 'remote', we assume Store filters are added by the developer as remote filters,
                    // and these are automatically passed as params with every load call, so we do *not* call clearFilter.
                    if (me.pageSize) {
                        // if we're paging, we've changed the query so start at page 1.
                        me.loadPage(1);
                    } else {
                        store.load({
                            params: me.getParams(queryString)
                        });
                    }
                }
            }

            // Clear current selection if it does not match the current value in the field
            if (me.getRawValue() !== me.getDisplayValue()) {
                me.ignoreSelection++;
                me.picker.getSelectionModel().deselectAll();
                me.ignoreSelection--;
            }

            if (isLocalMode) {
                me.doAutoSelect();
            }
            if (me.typeAhead) {
                me.doTypeAhead();
            }
        }
        return true;
    }
});
