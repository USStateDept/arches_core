Ext.define('FGI.widgets.SideTabPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'fgi-widgets-sidetabpanel',

    layout: 'card',

    tabDock: 'left',
    tabToolbar: null,
    border: false,
    style: 'background: transparent;',
    bodyStyle: 'background: transparent;border:0px;padding: 0;',
    iconAlign: 'top',
    buttonScale: 'large',
    tabControls: [],
    tabToolbarHeight: 44,
    tabToolbarWidth: 56,

    initComponent: function () {
        this.addEvents({
            'beforetabchanged': true,
            'aftertabchanged': true
        });

        this.callParent(arguments);

        this.addTabControls();

        this.on({
            'add': this.addTabControls,
            scope: this
        });
    },

    addTabControls: function () {
        if (this.tabToolbar) {
            this.removeDocked(this.tabToolbar, true);
        }

        var tabControls = [];
        var firstTabIndex = 0;
        var firstTabAdded = false;
        if (this.items.length > 0) {
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
                    var iconCls;
                    var iconAlign;
                    item.tabControlId = tabControlId;
                    if (index == firstTabIndex) {
                        pressed = true;
                        firstTabAdded = true;
                        this.pressedTabButton = tabControlId;
                    }

                    if (item.tabIconCls) {
                        iconCls = item.tabIconCls;
                        iconAlign = this.iconAlign;
                    }

                    var tabControl = Ext.create('Ext.button.Button', {
                        id: tabControlId,
                        iconCls: iconCls,
                        iconAlign: iconAlign,
                        scale: this.buttonScale,
                        textAlign: 'center',
                        text: ' ',
                        width: 46,
                        height: 34,
                        cls: 'side-tab-btn',
                        pressed: pressed,
                        toggleGroup: 'formtabs',
                        allowDepress: false,
                        ui: 'fgi_button_white',
                        style: 'margin:2px;',
                        handler: function (btn) {
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
                    });

                    item.on('activate', function () {
                        if (!tabControl.pressed) {
                            tabControl.toggle(true);
                        }
                    }, this);

                    tabControls.push(tabControl);
                }
            }, this);

            this.on('afterlayout', function () {
                this.layout.setActiveItem(firstTabIndex);
            }, this, { single: true });

            var tabToolbarConfig = {
                border: false,
                dock: this.tabDock,
                ui: 'fgi_panel_gray_transparent',
                items: tabControls.concat(this.tabControls)
            };

            if (this.tabDock === 'top' || this.tabDock === 'bottom') {
                tabToolbarConfig.layout = {
                    type: 'hbox',
                    align: 'middle'
                };
                tabToolbarConfig.height = this.tabToolbarHeight;
            } else {
                tabToolbarConfig.layout = {
                    type: 'vbox',
                    align: 'middle'
                };
                tabToolbarConfig.width = this.tabToolbarWidth;
            }

            this.tabToolbar = Ext.create('Ext.panel.Panel', tabToolbarConfig);

            this.addDocked(this.tabToolbar);
        }
    }
});
