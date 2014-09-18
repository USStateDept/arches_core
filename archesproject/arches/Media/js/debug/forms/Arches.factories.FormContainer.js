Ext.define('Arches.factories.FormContainer', {
    constructor: function () {
        this.formsCollection = new Ext.util.MixedCollection();
        this.formsCollection.addAll(Arches.i18n.DomainData.Forms);
        this.formsCollection.sort('sortorder', 'ASC');
    },

    create: function(formPanels){
        // simulate dynamically loading the stage: this could be an ajax call
        var formContainer = Ext.create('FGI.widgets.SideTabPanel',{
            style: 'background-color: #CFCFCF;',
            tabDock: 'top',
            tabToolbarHeight: 66,
            tabControls: [Ext.create('Ext.container.Container', {
                flex: 1
            }),
            Ext.create('Ext.button.Button', {
                xtype: 'button',
                ui: 'fgi_button_white',
                text: ' ',
                scale: 'medium',
                iconAlign: 'top',
                iconCls: 'glyph-arrowwest',
                handler: function (button) {
                    formContainer.fireEvent('backclicked');
                },
                scope: this,
                width: 46,
                height: 34,
                style: 'margin: 2px;'         
            })],
            items: formPanels,
            isValid: function () {
                var valid = true;

                this.items.each(function (item) {
                    if (item.isValid && !item.isValid()) {
                        valid = false
                    }
                }, this);

                return valid;
            }
        });

        Ext.each(formPanels, function (formPanel) {
            formPanel.on({
                'change': function () {
                    formContainer.fireEvent('change', formPanel);
                },
                scope: this
            })
        }, this);

        return formContainer;
    },

    getFromFormsArray: function (forms, controller) {
        var formPanels = [];
        Ext.Array.sort(forms, function (a, b) {  
            return a.sortorder - b.sortorder;  
        });
        Ext.each(forms, function (item, index, allItems) {
            var theform = this.formsCollection.getByKey(item.formid);
            formPanels.push(Ext.create(theform.widgetname, { 'tabTitle': theform.name, 'controller': controller }));
        }, this);
        return this.create(formPanels);
    }
});
