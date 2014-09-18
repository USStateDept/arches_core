/// <reference path="../../Ext-2.2/adapter/ext/ext-base.js" />
/// <reference path="../../Ext-2.2/ext-all-debug.js" />

Ext.namespace('FGI', 'FGI.widgets', 'FGI.config');

// Example configItems object to add new accordion panels to the tasks panel
FGI.config.Tasks = {
    configItems:
    [
    //        {
    //            title: 'Search Results',
    //            id: 'results',
    //            closable: true,
    //            items: {html: 'content'}
    //        },
    //
    //        {
    //            title: 'Activities',
    //            id: 'activities',
    //            html: 'content'
    //        }
    ]
};


/**
* Creates a wizard for form input.  Each object in the configItems becomes a step in the wizard.
* Each item in the configItems object should take the following form
* @cfg {Ext.Panel} panel: The Ext.Panel to add to the Tasks panel
*/

FGI.widgets.Tasks = Ext.extend(Ext.Panel, {

    // Constructor Defaults, can be overridden by user's config object

    configItems: [],

    //Class to use for highlighting panel headers when they are expanded
    highlightHeaderCls: 'x-accordion-hd-focus',

    /**
    * Overrides the 'add' method of Ext.Panel, and adds/removes a class to the header on expand/collapse
    *
    * @param {Ext.Panel} panel: The panel to add
    */

    add: function(panel) {
        // Add a close tool to the panel if panel.closable==true
        this.applyCloseTool(panel);

        //Apply listeners for highlighting panel headers on expand
        if (panel.id) {
            panel.on('expand', function(panel) {
                panel.header.addClass(this.highlightHeaderCls);
            }, this);
            panel.on('collapse', function(panel) {
                panel.header.removeClass(this.highlightHeaderCls);
            }, this);
        }

        FGI.widgets.Tasks.superclass.add.apply(this, arguments);
    },


    /**
    * Adds a new accordian panel to the Tasks panel
    * @param {Ext.Panel} panel: The panel to add
    */
    addPanel: function(panel) {
        this.add(panel);
        this.doLayout(true);
    },

    /**
    * Removes a panel from the Tasks panel
    * @param {String} panelId: The id of the panel to remove
    */
    closePanel: function(panelId) {
        panel = this.getComponent(panelId);
        panel.ownerCt.remove(panel, true);
        this.doLayout(true);
    },

    /**
    * Expands a panel
    * @param {String} panelId: The id of the panel to expand
    */
    expandPanel: function(panelId) {
        panel = this.getComponent(panelId);
        panel.expand();
    },

    /**
    * Collapses a panel
    * @param {String} panelId: The id of the panel to collapse
    */
    collapsePanel: function(panelId) {
        panel = this.getComponent(panelId);
        panel.collapse();
    },

    /**
    * Add a close tool to the header of the panel 
    * @param {Ext.Panel} panel: The panel to the tool to
    */
    applyCloseTool: function(panel) {
        if (panel.closable) {
            if (!panel.tools) {
                panel.tools = [];
            }
            panel.tools.push({
                id: 'close',
                handler: function(e, target, panel) {
                    parent = panel.ownerCt;
                    parent.remove(panel, true);
                    parent.doLayout(true);
                }
            });
        }
    },


    initComponent: function() {

        Ext.apply(this, {
            //non-overidable objects
            layout: 'accordion',
            border: false,
            items: this.configItems
        });

        // Add a close tool to each panel if panel.closable==true
        Ext.each(this.configItems, function(item, index, allItems) {
            this.applyCloseTool(item);
        }, this);

        FGI.widgets.Tasks.superclass.initComponent.apply(this, arguments);

    },

    // this is a hack since the dolayout doesnt seem to resize the panel 
    // correctly if we've added a hidden panel and then want to show it.
    doLayout: function() {
        this.setHeight(this.getSize().height + 1);
        FGI.widgets.Tasks.superclass.doLayout.apply(this, arguments);
    }

});
 