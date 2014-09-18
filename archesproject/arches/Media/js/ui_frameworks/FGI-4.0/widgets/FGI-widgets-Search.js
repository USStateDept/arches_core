/// <reference path="../../Ext-2.2/adapter/ext/ext-base.js" />
/// <reference path="../../Ext-2.2/ext-all-debug.js" />

Ext.namespace('FGI', 'FGI.widgets');

/**
* Creates a dropdown where user input can be directed to a URL and suggestions put into the dropdown.
* A template can be applied to format dropdown items.  Multiple directed searches can be used and appear below
* the dropdown as links.
* Each item in the searchGroups object should take the following form
* @cfg {String} name: The text to display as a link for the search
* @cfg {String} icon: The icon to display next to the link
* @cfg {String} startParam: the name of the paging start query parameter
* @cfg {String} limitParam: the name of the paging limit query parameter
* @cfg {function} onSelect: The function to call when a user selects an item in the dropdown list
* @cfg {function} onTriggerClick: The function to call when a user clicks the 'search' icon next to the dropdown list
* @cfg {Object} comboConfig: config options to be passed to the search comboBox for this search type
    * the comboConfig takes the following properties (see the documentation for the Ext.form.Combobox for more details)
        @cfg {String} searchType: A unique name to call the search
        @cfg {String} emptyText: The default text to place into an empty field (defaults to null).
            * Note: that this value will be submitted to the server if this field is enabled and configured
            * with a {@link #name}.
        @cfg {String} itemSelector: A simple CSS selector (e.g. div.some-class or span:first-child) that will be
            * used to determine what nodes the {@link #view Ext.DataView} which handles the dropdown
            * display will be working with.
        @cfg {Ext.XTemplate} tpl: The template string, or {@link Ext.XTemplate} instance to
            * use to display each item in the dropdown list. The dropdown list is displayed in a
            * DataView. See {@link #view}.
        @cfg {String} queryParam: Name of the query ({@link Ext.data.Store#baseParam baseParam} name for the store)
            * as it will be passed on the querystring (defaults to 'query')
        @cfg {Ext.store} store: The data source to which this combo is bound (defaults to undefined).
*
* The search panel has the following additional config options, properties, methods, and events -
*
* Config Options:
*   - searchGroups: Array
*       An array of search type definitions to be added to the search widget.
*       see above for a complete definition
*   - pageSize: Number
*       the size of a page in the combo dropdown. defaults to 10.
*   - fieldLabel: String
*       the text of the combo box label. defaults to 'Search'
*   - hideLabel: Boolean
*       true to hide the combo box label
*   - comboWidth: Number
*       the pixel width of the combo box.  defaults to 390.
*   - loadingText: String
*       the text that will be displayed in the drop down while loading.  defaults to 'Searching...'
*   - width: Number
*       the pixel width of the search panel.  defaults to 470.
*   - labelWidth: Number
*       the pixel width of the combobox label.  defaults to 50.
*   - labelAlign: String
*       the alignment of the combobox label
*   - frame: Boolean
*       true to apply the rounded panel background / border.  defaults to true
*   - bodyStyle: String
*       style to apply to the body of the search panel.  defaults to 'padding:5px 5px 0'
*   - cancelQuery: Boolean
*       True to disallow the call to the url associated with the search. defaults to false.
*   - addGoogleSearch: Boolean
*       True to add the link to a google search.  defaults to false.
*   - googleLinkText: String
*       The link text to show for a google search.   defaults to 'Google Address Search'
*   - googleEmptyText: String
*       The text to show as a mask for the input box.   defaults to 'Google Address search...'
*   - googleHandler: function
*       Function to call when a user selects an item from a google search
*           @param {record} the google search item
*   - googleTriggerHandler: function
*       Function to call when a user clicks the 'search' icon next to the dropdown for a google search
*   - googleEmptyText: String
*       The text to show as a mask for the input box.   defaults to 'Google Address search...'
*   - googleSearchItemTemplate: Ext.XTemplate
*       The template to use to render google search items
*   - defaultTriggerHandler: function
*       The default function to call when a user clicks the 'search' icon next to the dropdown all user defined searches
*
* Public Events:
*   - searchbuttonclicked(String value, Ext.form.ComboBox comboBox)
*       Fires on click of the search button
*   - searchitemselected(Ext.form.ComboBox combo, Ext.data.Record record, Number index, String searchType)
*       Fires on select of an item from the search dropdown
*   - searchtypeselected(Ext.form.ComboBox theComboBox, String searchType)
*       Fires on select of a search type
*/

FGI.widgets.Search = Ext.extend(Ext.form.FormPanel, {
    // Constructor Defaults, can be overridden by user's config object

    /**
    * Array of Search objects
    */
    searchGroups: [],

    /**
    * Number of items to display in the dropdown
    */
    pageSize: 10,

    /**
    * The label of the dropdown
    */
    fieldLabel: 'Search',


    /**
    * Hide the label of the dropdown
    */
    hideLabel: false,

    /**
    * The width of the dropdown
    */
    comboWidth: 390,

    /**
    * The default mask to display in the dropdown
    */
    loadingText: 'Searching...',

    /**
    * The width of the search panel
    */
    width: 470,

    /** 
    * (label settings here cascade unless overridden)
    * The width of the field label
    */
    labelWidth: 50,

    /** 
    * The alignment of the field label
    */
    labelAlign: 'left',

    /** 
    * True to render panel w/ rounded borders
    */
    frame: true,

    /** 
    * apply default padding to body
    */
    bodyStyle: 'padding:5px 5px 0',

    /** 
    * true to automatically set panel height
    */
    autoHeight: true,

    /** 
    * default type for fields in search panel
    */
    defaultType: 'textfield',

    /** 
    * default call applied to search panel
    */
    cls: 'fgi-search-box',

    /**
    * True to disallow the call to the url associated with the search
    */
    cancelQuery: false,

    /**
    * True to add the link to a google search
    */
    addGoogleSearch: false,

    /**
    * The link text to show for a google search
    */
    googleLinkText: 'Google Address Search',

    /**
    * The text to show as a mask for the input box
    */
    googleEmptyText: 'Google Address search...',

    /**
    * Function to call when a user selects an item from a google search
    * @param {record} the google search item
    */
    googleHandler: function(combo, record, index) { window.open('http://maps.google.com/?q=' + record.data.address, 'Search Result'); },

    /**
    * Function to call when a user clicks the 'search' icon next to the dropdown for a google search
    */
    googleTriggerHandler: function(combo) {
        recordCount = combo.store.getCount();
        if (recordCount >= 1) {
            Ext.Msg.alert('Record Count', recordCount);
        }
    },

    /**
    * The template to use to render google search items
    */
    googleSearchItemTemplate: new Ext.XTemplate(
        '<tpl for="."><div class="search-item"><table>',
        '<td><h3>{address}</h3></td>',
        '</table></div></tpl>'
    ),

    /**
    * The default function to call when a user clicks the 'search' icon next to the dropdown all user defined searches
    */
    defaultTriggerHandler: function() {
        Ext.Msg.alert('You clicked the search trigger');
    },

    /**
    * The class to pass to the combobox trigger, defaults to a search icon
    */
    triggerClass: 'x-form-trigger x-form-search-trigger',

    reconfigureComboBox: function(combo, config, triggerSequence) {
        combo.onTriggerClick = triggerSequence;

        Ext.apply(combo, config.comboConfig);

        Ext.override(Ext.PagingToolbar, {
            paramNames: {
                start: config.startParam,
                limit: config.limitParam
            }
        });

        combo.getParams = function(q) {
            var p = {};
            if (this.pageSize) {
                p[config.startParam] = 0;
                p[config.limitParam] = this.pageSize;
            }
            return p;
        };

        // we simply extend the Ext 'select' event from the ComboBox
        // to the Search widget itself (see onSearchButtonClick above)
        combo.on('select', function(combo, record, index) {
            config.onSelect(combo, record, index);
            this.ownerCt.onSearchItemSelected(combo, record, index, config.comboConfig.searchType);
        });
    },

    turnDropDownOff: function() {
        this.ComboBox.on('beforequery', this.cancelFunc);
        this.enterKeyMap.enable();
    },

    turnDropDownOn: function() {
        this.ComboBox.un('beforequery', this.cancelFunc);
        this.enterKeyMap.disable();
    },

    initComponent: function() {

        // Events for clicking the searchicon and selecting from the dropdown list
        this.addEvents({
            'searchbuttonclicked': true,
            'searchitemselected': true,
            'searchtypeselected': true
        });

        // private
        // fires the searchbuttonclicked event when the user clicks the search icon
        this.onSearchButtonClick = function() {
            //Ext.log('onTriggerClick fired');
            this.fireEvent('searchbuttonclicked', this.ComboBox.getValue(), this.ComboBox);
        };

        // private
        // fires the searchitemselected event when the user selects an item in the dropdown list
        this.onSearchItemSelected = function(combo, record, index, searchType) {
            //Ext.log('onTriggerClick fired');
            this.fireEvent('searchitemselected', combo, record, index, searchType);
        };

        this.ComboBox = new Ext.form.ComboBox({
            fieldLabel: this.fieldLabel,
            hideLabel: this.hideLabel,
            name: this.comboName,
            id: this.comboId,
            typeAhead: false,
            scope: this,
            loadingText: this.loadingText,
            selectOnFocus: true,
            triggerClass: this.triggerClass,
            onTriggerClick: this.defaultTriggerHandler,
            pageSize: this.pageSize,
            enableKeyEvents: true
        });

        this.ComboBox.on('focus', function() {
            if (this.ComboBox.isExpanded() == false) {
                value = this.ComboBox.getValue();
                this.ComboBox.doQuery(value, false);
            }
        }, this);

        Ext.apply(this, {
            //non-overidable objects
            defaults: { width: this.comboWidth },
            items: [
                this.ComboBox
            ]
        });

        markers = false;

        var GoogleSearch = {
            name: this.googleLinkText,
            iconCls: 'fgi-google-search',
            onSelect: this.googleHandler,
            onTriggerClick: this.googleTriggerHandler.createDelegate(this, [this.ComboBox]),
            comboConfig: {
                searchType: 'google',
                emptyText: this.googleEmptyText,
                itemSelector: 'div.search-item',
                tpl: this.googleSearchItemTemplate,
                queryParam: 'q',
                store: new Ext.data.Store({
                    proxy: new Ext.data.ScriptTagProxy({
                        url: 'http://maps.google.com/maps/geo?output=json&oe=utf-8&'
                    }),
                    reader: new Ext.data.JsonReader({
                        root: 'Placemark'
                    }, [
                        { name: 'id', mapping: 'id' },
                        { name: 'address', mapping: 'address' },
                        { name: 'AddressDetails', mapping: 'AddressDetails' },
                        { name: 'Point', mapping: 'Point' },
                        { name: 'ExtendedData', mapping: 'ExtendedData' }
                    ])
                })
            }
        };

        //force at least a Google search if none was specified
        if (this.searchGroups.length == 0) {
            this.addGoogleSearch = true;
        }

        //add the Google search to the group if specified
        if (this.addGoogleSearch) {
            this.searchGroups.push(GoogleSearch);
        }

        // set up the cancel function if we don't want to use an ajax query
        this.cancelFunc = function(queryEvent) {
            queryEvent.cancel = true;
        };

        // need to setup the KeyMap afterlayout because it's tied to a dom element
        // function to call when the enter key is pressed
        // only used when cancelQuery = true
        this.on('afterLayout', function() {
            this.enterKeyMap = new Ext.KeyMap(this.ComboBox.el.dom, {
                key: Ext.EventObject.ENTER,
                fn: this.onSearchButtonClick,
                scope: this
            });
            this.enterKeyMap.disable();
            Ext.each(this.searchGroups, function(item, index, allItems) {
                if (item.isDefault == true || index == 0) {
                    if (item.cancelQuery) {
                        this.ComboBox.on('beforequery', this.cancelFunc);
                        this.enterKeyMap.enable();
                    }
                }
            }, this);
        }, this);

        // Add the links for each search below the dropdown
        Ext.each(this.searchGroups, function(item, index, allItems) {
            // Creates a single function to fire the internal event "onSearchButtonClick" and 
            // what ever the user passed into the onTriggerClick function of the search config obj
            var triggerSequence = this.onSearchButtonClick.createSequence(
                item.onTriggerClick || this.defaultTriggerHandler, this);

            // force the triggerSequence(onSearchButtonClick) to have the scope of 
            // the Search.widget instead of the ComboBox
            triggerSequence = triggerSequence.createDelegate(this);

            //set the first item to the default, if it isn't it'll get overwritten
            if (item.startParam == undefined) {
                item.startParam = 'start';
            }
            if (item.limitParam == undefined) {
                item.limitParam = 'limit';
            }
            if (item.isDefault == true || index == 0) {
                this.reconfigureComboBox(this.ComboBox, item, triggerSequence);
            }

            if (this.searchGroups.length > 1) {
                if (item.icon == undefined && item.iconCls == undefined) {
                    customClass = 'fgi-search-btn';
                }
                else {
                    customClass = 'x-btn-text-icon fgi-search-btn';
                }

                var id = Ext.id();
                if (item.btnId != undefined) {
                    id = item.btnId;
                }
                this.addButton(
                    {
                        id: id,
                        text: item.name,
                        scope: this,
                        cls: customClass,
                        icon: item.icon,
                        iconCls: item.iconCls,
                        toggleGroup: 'tg',
                        enableToggle: true,
                        allowDepress: false,
                        pressed: item.isDefault,
                        tooltip: item.tooltip
                    },
                    function() {
                        theComboBox = Ext.getCmp(this.ComboBox.id);

                        theComboBox.store.removeAll();
                        theComboBox.list = false;

                        theComboBox.events['select'].clearListeners();

                        this.reconfigureComboBox(theComboBox, item, triggerSequence);

                        theComboBox.clearValue();

                        theComboBox.initList();

                        if (item.cancelQuery) {
                            theComboBox.on('beforequery', this.cancelFunc);
                            this.enterKeyMap.enable();
                        } else {
                            theComboBox.un('beforequery', this.cancelFunc);
                            //theComboBox.events['beforequery'].clearListeners();
                            this.enterKeyMap.disable();
                        }

                        this.fireEvent('searchtypeselected', theComboBox, theComboBox.searchType);



                    }
                );
            }
        },
        this);

        FGI.widgets.Search.superclass.initComponent.apply(this, arguments);
    }

});
 
