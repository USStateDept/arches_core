Ext.define('FGI.widgets.FormContainer', {
    extend: 'Ext.panel.Panel',
    alias: 'fgi-widgets-formcontainer',

    layout: 'card',

    featureId: null,
    geometryFeature: null,
    lookupStore: null,
    readOnly: false,

    initComponent: function () {
        this.addEvents({
            'okclicked': true,
            'deleteclicked': true,
            'cancelclicked': true,
            'saveclicked': true,
            'aftersaveall': true,
            'afterdelete': true,
            'beforetabchanged': true,
            'aftertabchanged': true
        });

        this.saveableForms = 0;

        var bbarItems = [
            '->',
            {
                text: 'Delete',
                iconCls: 'deletebutton',
                scope: this,
                handler: function () {
                    this.fireEvent('deleteclicked');
                }
            },
            {
                text: 'Cancel',
                iconCls: 'cancelbutton',
                scope: this,
                handler: function () {
                    this.fireEvent('cancelclicked');
                }
            },
            {
                text: 'Save',
                iconCls: 'savebutton',
                scope: this,
                handler: function () {
                    this.fireEvent('saveclicked');
                }
            }
        ];

        if (this.readOnly) {
            bbarItems = [
                '->',
                {
                    text: 'Done',
                    iconCls: 'okbutton',
                    scope: this,
                    handler: function () {
                        this.fireEvent('okclicked');
                    }
                }
            ];
        }

        this.dockedItems.push({
            xtype: 'toolbar',
            dock: 'bottom',
            border: 0,
            items: bbarItems
        });

        this.callParent(arguments);

        this.addTabControls();
    },

    addTabControls: function () {
        var tabControls = [];
        var firstTabIndex = 0;
        var firstTabAdded = false;

        this.items.each(function (item, index, allitems) {
            var text = 'Item ' + (index + 1);
            if (item.title) {
                text = item.title;
            } else if (item.tabTitle) {
                text = item.tabTitle;
            }

            if (item.hideTab) {
                if (!firstTabAdded) {
                    firstTabIndex = firstTabIndex + 1;
                }
            } else {
                var pressed = false;
                var tabControlId = Ext.id();
                if (index == firstTabIndex) {
                    pressed = true;
                    firstTabAdded = true;
                    this.pressedTabButton = tabControlId;
                }

                var tabControl = {
                    id: tabControlId,
                    text: text,
                    width: 110,
                    height: 32,
                    pressed: pressed,
                    toggleGroup: 'formtabs',
                    allowDepress: false,
                    cls: 'left-txt-btn',
                    ui: 'fgi_button_white',
                    toggleHandler: function (btn, state) {
                        if (typeof this.pressedTabButton == "string") {
                            this.pressedTabButton = Ext.getCmp(this.pressedTabButton);
                        }

                        if (this.fireEvent('beforetabchanged', this.layout.activeItem)) {
                            this.layout.setActiveItem(index);
                            this.pressedTabButton = btn;
                            this.fireEvent('aftertabchanged', this.layout.activeItem);
                        } else {
                            btn.toggle(false, true);
                            this.pressedTabButton.toggle(true, true);
                        }
                    },
                    scope: this
                };
                if (item.tabIconCls) {
                    tabControl.iconCls = item.tabIconCls;
                    tabControl.iconAlign = 'left';
                }
                tabControls.push(tabControl);
                tabControls.push('-');
            }
        }, this);

        this.on('afterlayout', function () {
            this.layout.setActiveItem(firstTabIndex);
        }, this, { single: true });

        this.addDocked({
            xtype: 'toolbar',
            border: 0,
            dock: 'left',
            layout: 'vbox',
            width: 115,
            items: tabControls
        });
    },

    isValid: function () {
        var valid = true;

        this.items.each(function (item) {
            if (item.isValid && !item.isValid()) {
                valid = false
            }
        }, this);

        return valid;
    },

    saveAll: function () {
        this.saveSuccessful = true;
        this.saveableForms = 0;
        var countOfEntities = 0;
        var entityType = null;

        // first find the entity form if any and confirm there is only 1 or 0
        this.items.each(function (item, index, allitems) {
            if (item.isEntity) {
                entityType = item.xtype;
                countOfEntities++;
            }
            // if the form has a save fucnction register listener so we can fire the saveall event when appropriate
            if (item.save) {
                this.saveableForms++;
                item.on('aftersave', this.checkAllSaved, this, { single: true });
            }
        }, this);

        // setup a function that'll save all the forms except for the entity form (if it exists)
        var saveRemainingItems = function (records, operation) {
            if (!operation.wasSuccessful()) {
                this.saveSuccessful = false;
            }
            entityId = records.getId() || this.featureId;
            this.items.each(function (item, index, allitems) {
                if (item.xtype != entityType) {
                    try {
                        // need to set the featureId when inserting a new feature
                        item.featureId = entityId;
                        item.save(entityId);
                    } catch (e) { }
                }
            }, this);
        };

        if (countOfEntities <= 1) {
            //submit the entity form if any
            if (countOfEntities == 1) {
                var theEntityForm = this.down(entityType);

                theEntityForm.on({
                    'aftersave': saveRemainingItems,
                    single: true,
                    scope: this
                });
                theEntityForm.save();
            } else {
                Ext.callback(saveRemainingItems, this);
            }
        } else {

            // throw an error or do nothing because you have more then 1 form flagged as an entity form

        }

    },

    /*
    private
    */
    checkAllSaved: function (records, operation) {
        if (!operation.wasSuccessful()) {
            this.saveSuccessful = false;
        }
        this.saveableForms--;
        if (this.saveableForms == 0) {
            this.fireEvent('aftersaveall', this.saveSuccessful);
        }
    },

    // unused
    //    loadAll: function () {
    //        this.items.each(function (item, index, allitems) {
    //            item.load(this.featureId);
    //        }, this);
    //    },

    // override the container's default deleteAll function
    // here we just need to call one url to delete the whole entity
    deleteAll: function () {
        Ext.Ajax.request({
            url: Colliers.config.URLs.entity + '/' + this.featureId,
            method: 'DELETE',
            callback: function (response) {
                this.fireEvent('afterdelete');
            },
            scope: this
        });
    }
});