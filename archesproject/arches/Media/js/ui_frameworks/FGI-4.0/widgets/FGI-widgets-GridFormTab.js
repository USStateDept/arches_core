Ext.define('FGI.widgets.GridFormTab', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.colliers-widgets-gridformtab',
    layout: {
        type: 'hbox',
        pack: 'start',
        align: 'stretch'
    },

    // the id of the item being edited
    featureId: null,
    tabTitle: 'Form',
    tabIconCls: 'pagewhitetext',
    geometry: null,
    hideTab: false,
    model: '',
    lookupStore: null,
    gridColumns: [],
    formDefaults: {
        fieldDefaults: {
            labelAlign: 'top',
            msgTarget: 'qtip'
        },
        defaults: {
            xtype: 'textfield',
            anchor: '100%'
        },
        autoScroll: true,
        bodyStyle: 'padding-left: 10px; padding-right: 10px;',
        border: false,
        flex: 1,
        trackResetOnLoad: false
    },
    readOnly: false,


    initComponent: function () {
        this.addEvents({
            'beforesave': true,
            'aftersave': true,
            'beforeload': true,
            'afterload': true,
            'beforeformchange': true,
            'afterformchange': true,
            'beforeselectionchange': true,
            'afterselectionchange': true,
            'beforeremove': true,
            'afterremove': true,
            'beforeadd': true,
            'afteradd': true
        });

        this.store = Ext.create('Ext.data.Store', {
            model: this.model
        });

        this.addButton = Ext.create('Ext.button.Button', {
            text: 'Add',
            iconCls: 'addfeature',
            scope: this,
            handler: this.addNewRecord
        });

        this.removeButton = Ext.create('Ext.button.Button', {
            text: 'Remove',
            iconCls: 'deletebutton',
            scope: this,
            handler: this.deleteSelection
        });

        this.grid = Ext.create('Ext.grid.Panel', {
            store: this.store,
            columns: this.gridColumns,
            flex: 1,
            selModel: {
                mode: 'SINGLE',
                allowDeselect: false
            }
        });

        this.form = Ext.create('Ext.form.Panel', this.formDefaults);

        this.items = [this.form, this.grid];

        this.callParent(arguments);

        this.form.items.each(function (item, index, allItems) {
            if (item.enableBubble) {
                item.enableBubbble('change');
            }
        }, this);

        this.form.on({
            'add': function (form, cmp) {
                if (cmp.enableBubble) {
                    cmp.enableBubble('change');
                }
            },
            scope: this
        });

        this.form.on('change', this.onFormChange, this);
        this.form.on({
            'change': this.onFormChange,
            scope: this
        });

        var selModel = this.grid.getSelectionModel();
        selModel.on('selectionchange', this.onSelectionChange, this);

        if (this.readOnly) {
            this.on({
                'afterrender': function () {
                    this.form.getForm().getFields().each(function (item) {
                        item.disable();
                    });
                },
                scope: this
            });
        } else {
            this.grid.addDocked({
                xtype: 'toolbar',
                dock: 'top',
                items: [
                    this.addButton,
                    this.removeButton
                ]
            });
        }

        this.on('activate', function () {
            if (this.store) {
                this.grid.reconfigure(this.store, this.gridColumns);
            }
        }, this);

        this.store.proxy.on('exception', function (proxy, response, operation) {
            if (operation.action == 'create' || operation.action == 'update') {
                this.fireEvent('aftersave', [], operation, false);
            }
        }, this);
    },

    isValid: function () {
        var valid = true;

        this.store.data.each(function (record) {
            if (!record.validate().isValid()) {
                valid = false
            }
        }, this);

        return valid;
    },

    addNewRecord: function () {
        this.fireEvent('beforeadd', this);
        var record = Ext.create(this.model);
        this.store.add(record);
        this.grid.getSelectionModel().select([record]);
        this.fireEvent('afteradd', this);
    },

    deleteRecords: function (records) {
        if (records.length > 0) {
            this.store.remove(records);
        }
    },

    deleteSelection: function () {
        this.fireEvent('beforeremove', this);
        var records = this.grid.getSelectionModel().getSelection();
        var selModel = this.grid.getSelectionModel();
        selModel.un('selectionchange', this.onSelectionChange, this);
        this.form.un('change', this.onFormChange, this);
        this.deleteRecords(records);
        this.form.getForm().reset();
        this.form.on('change', this.onFormChange, this);
        selModel.on('selectionchange', this.onSelectionChange, this);
        this.fireEvent('afterremove', this);
    },

    onFormChange: function () {
        this.fireEvent('beforeformchange', this);
        var form = this.form.getForm();
        var record = form.getRecord();
        if (record && record.store) {
            form.updateRecord(record);
        } else {
            record = Ext.create(this.model);
            this.store.add(record);
            form.updateRecord(record);
            this.grid.getSelectionModel().select([record]);
        }
        this.fireEvent('afterformchange', this);
    },

    onSelectionChange: function (selModel, models) {
        this.fireEvent('beforeselectionchange', this, selModel, models);
        this.form.un('change', this.onFormChange, this);
        this.form.loadRecord(models[0]);
        this.form.on('change', this.onFormChange, this);
        this.fireEvent('afterselectionchange', this, selModel, models);
    },

    //    // *****IMPORTANT!!!****
    //    // TODO: This has been added temporarily to prevent loading masks while services are in development
    //    // to test the load service you will need to comment or remove this block!
    // put code here to load data into the store
    load: function (id) {
        if (this.fireEvent('beforeload', this)) {
            if (id) {
                this.store.load({
                    id: id,
                    scope: this,
                    callback: function (records, operation, success) {
                        this.fireEvent('afterload', this);
                    }
                });
            } else {
                this.fireEvent('afterload', this);
            }
        }
    },

    // put code here to preprocess the data before saveing
    save: function (entityId) {
        if (this.fireEvent('beforesave', this)) {
            this.saveStore({
                id: entityId,
                scope: this,
                callback: function (records, operation, success) {
                    this.fireEvent('aftersave', records, operation, success);
                }
            });
        }
    },

    saveStore: function (options) {
        options = Ext.apply({}, options);

        var me = this,
            action = 'create',
            records = null,
            scope = options.scope || me,
            operation,
            callback;

        // the assumption is all records are either new or existing, but not a mix of both
        this.store.each(function (rec) {
            if (!rec.phantom) {
                action = 'update';
            }
        }, this);

        Ext.apply(options, {
            records: this.store.getRange(),
            action: action
        });

        operation = Ext.create('Ext.data.Operation', options);

        callback = function (operation) {
            if (operation.wasSuccessful()) {
                records = operation.getRecords();
                //we need to make sure we've set the updated data here. Ideally this will be redundant once the
                //ModelCache is in place
                //me.set(record.data);
                //record.dirty = false;

                Ext.callback(options.success, scope, [records, operation, operation.wasSuccessful()]);
            } else {
                Ext.callback(options.failure, scope, [records, operation, operation.wasSuccessful()]);
            }

            Ext.callback(options.callback, scope, [records, operation]);
        };

        this.store.getProxy()[action](operation, callback, me);

        return me;
    }
});