Ext.define('FGI.widgets.FormTab', {
    extend: 'Ext.form.Panel',
    baseCls: 'x-plain',
    alias: 'widget.colliers-widgets-formtab',
    tabTitle: 'Form',
    tabIconCls: 'pagewhitetext',
    fieldDefaults: {
        labelAlign: 'top',
        msgTarget: 'qtip'
    },
    defaults: {
        xtype: 'textfield',
        anchor: '100%'
    },
    autoScroll: true,

    // the id of the item being edited
    featureId: null,
    geometryFeature: null,
    hideTab: false,
    model: '',
    lookupStore: null,
    readOnly: false,
    isEntity: false,

    initComponent: function () {
        this.addEvents({
            'beforesave': true,
            'aftersave': true,
            'beforeload': true,
            'afterload': true
        });

        this.callParent(arguments);

        if (this.readOnly) {
            this.on({
                'afterrender': function () {
                    this.getForm().getFields().each(function (item) {
                        item.disable();
                    });
                },
                scope: this
            });
        }

        this.on({
            'afterload': this.addProxyListener,
            scope: this
        });
    },

    addProxyListener: function () {
        this.getRecord().proxy.on('exception', function (proxy, response, operation) {
            if (operation.action == 'create' || operation.action == 'update') {
                this.fireEvent('aftersave', [], operation, false);
            }
        }, this);
    },

    isValid: function () {
        return this.getForm().isValid();
    },

    // put code here to preprocess the data before saveing
    save: function (entityId) {
        if (this.fireEvent('beforesave', this)) {
            var rec = this.getRecord();
            this.getForm().updateRecord(rec);
            rec.save({
                id: this.featureId,
                callback: function (records, operation, success) {
                    this.fireEvent('aftersave', records, operation, success);
                },
                scope: this
            });
        }
    },

    // put code here to load data into the store
    load: function (id) {
        if (this.fireEvent('beforeload', this)) {
            if (id) {
                Ext.ModelManager.getModel(this.model).load(id, {
                    scope: this,
                    callback: function (record, operation) {
                        if (!record) {
                            record = Ext.create(this.model);
                        }
                        this.loadRecord(record);
                        this.fireEvent('afterload', this);
                    }
                });
            } else {
                var rec = Ext.create(this.model);
                this.loadRecord(rec);
                this.fireEvent('afterload', this);
            }
        }
    }
});