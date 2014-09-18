Ext.namespace('FGI', 'FGI.component');

/// <reference path="../../Ext-2.2/adapter/ext/ext-base.js" />
/// <reference path="../../Ext-2.2/ext-all-debug.js" />

/**
* @class FGI.component.ButtonWindow
* @extends Ext.Button
* Simple class that extends the Ext.Toolbar.Button class.  Allows you to create a button that encapsulates an Ext.Window.  
* Good for allowing you to tie opening and closing a window to the toggle state of a button.
* Takes all the standard config properties of an Ext.Toolbar.Button, 
* in addition the following config items are added:
* @cfg {Object} windowConfig The standard Ext.Window config parameters normally passed to a Ext.Window object
* @cfg {Function} toggleHandler Function that gets fired when the user clicks the button
* @constructor
* Create a new button with associated window
* @param {Object} config The config object
*/

/*
* EXAMPLE USAGE

   this.tasksButton = new FGI.component.ButtonWindow({
        text: 'Tasks',
        windowConfig: {
            title:'Tasks',
            items: new FGI.widgets.Tasks({
                configItems: [
                    MEGA.app.SearchResults = new MEGA.widgets.searchResults({ collapsed: true }),
                    MEGA.app.Activities = new MEGA.widgets.Activities(),
                    MEGA.app.MyLists = { title: 'My Lists', collapsed: true }
                ]
            })
        }
    });
*/


// This has to be a Toolbar.Button if you want it to render into a toolbar (duh..)
FGI.component.ButtonWindow = Ext.extend(Ext.Button, {
    // Constructor Defaults, can be overridden by user's config object

    // Ext.Window specific config items
    windowConfig: {},

    // Function to handle showing and hiding of the window when the user clicks the button
    toggleHandler: function(target, enabled) {
        if (enabled) {
            this.window.show(this.getEl());
        } else {
            this.window.hide();
        }
    },


    // default button specific config items
    enableToggle: true,
    text: 'FGI.component.ButtonWindow',

    // alternate text to show when the user clicks the button, will default to the "text" paramter
    textToggle: '',

    initComponent: function() {

        // set the default text, make a copy because "text" gets overwritten later
        this._btnText = this.text;
        if (this.textToggle == '') {
            this.textToggle = this.text;
        }

        // Button specific config items here
        Ext.apply(this, {});

        // Ext.Window specific config items
        var _config = {
            title: 'FGI.component.ButtonWindow',
            layout: 'fit',
            closable: true,
            closeAction: 'hide',
            draggable: true,
            width: 300,
            constrain: true,
            height: 400
        };

        // override any of the defaults above with whatever the user passed in
        Ext.apply(_config, this.windowConfig);

        // apply these non-overridable parameters to the window config object
        Ext.apply(_config, {
            btn: this, // Add a reference to the button in the window so the window can toggle the button state
            listeners: {
                'hide': function(w) {
                    w.btn.toggle(false);
                    w.btn.setText(w.btn._btnText);
                },
                'show': function(w) {
                    w.btn.toggle(true);
                    w.btn.setText(w.btn.textToggle);
                }
            }
        });
        this.windowConfig = _config;

        // add the window to the button
        this.window = new Ext.Window(this.windowConfig);


        FGI.component.ButtonWindow.superclass.initComponent.apply(this, arguments);

    }

});
