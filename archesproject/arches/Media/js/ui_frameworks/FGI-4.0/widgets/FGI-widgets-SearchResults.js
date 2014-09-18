
Ext.namespace('FGI', 'FGI.widgets');


FGI.widgets.SearchResults = Ext.extend(Ext.grid.GridPanel, {
    // Constructor Defaults, can be overridden by user's config object


    /**
    * @searchResultTypes Object[] - Array of objects configured as below
    *
    * @type String - Flag to use to differentiate search types
    * @title String - gets displayed in the grid header
    * @titleRenderer Function - the function to use to render the grid item
    * @expanderUrl String - the url to call when expanding a grid row
    * @reader Ext.data.Reader - reader used to parce the data that populates the grid
    * @expanderIdField String - a field name from the reader whose data gets appended to the expanderUrl
    * @sortFields Object[] - fields to use as flags to sort the grid by, gets appened to the expanderUrl
    * @isDefault Boolean - True if this is the default search type
    * 
    * Example: 
    */
    //    searchResultTypes: [{
    //        type: 'site',
    //        title: 'Sites',
    //        titleRenderer: function(value, p, record) {
    //            return String.format(
    //            '<div style="font-weight:bold; font-size:13px; color:#15428B;">{0}</div><div style="font-weight:bold; font-size:10px; color:#15428B;">{4}</div><div style="font-weight:bold; font-size:11px; color:#15428B;">MEGA-J Number: {1}</div><div style="color:#808080;">Location: Jordan > {2} > {3}</div>',
    //            record.data.site_name, record.data.mk_mega_key, record.data.governorate, record.data.subgovernorate, record.data.site_names_list);
    //        },
    //        expanderUrl: MEGA.config.Urls.Site,
    //        reader: new Ext.data.JsonReader({
    //            root: 'Sites',
    //            totalProperty: 'TotalCount'
    //        },
    //            MEGA.data.Site
    //        ),
    //        expanderIdField: 'sit_site_gid',
    //        sortFields: [{ text: 'Name', id: 'Name', isDefault: true }, { text: 'MEGA Number', id: 'MEGA Number'}],
    //        isDefault: true
    //    }]
    //
    searchResultTypes: [],

    title: 'Search Results',
    autoWidth: true,
    pageSize: 10,
    viewConfig: {
        /**
        * @cfg {Boolean} forceFit True to auto expand/contract the size of the columns to fit the grid width and prevent horizontal scrolling.
        */
        forceFit: true
    },
    loadMask: true,
    sortLabel: 'Sort By:',
    sortTooltipConfig: { text: 'Click here to sort search results', title: 'Sort Results' },
    printButtonText: 'Print Page',
    exportButtonText: 'Export Results',
    clearButtonText: 'Clear Search',
    optionsButtonText: 'Options',
    printPage: null,
    exportResultsToCsv: null,
    showTopToolbar: true,
    cls: 'grid-no-header',


    //public methods here
    initComponent: function() {
        this.addEvents({
            'rowselected': true,
            'afterupdate': true,
            'clear': true
        });

        // Set up an empty store and proxy
        this.store = new Ext.data.Store({
            proxy: new Ext.data.HttpProxy({
                url: "",
                method: 'GET'
            }),
            autoLoad: false
        });
        this.store.on('load', this.onAfterUpdate, this);
        this.store.on('add', this.onAfterUpdate, this);
        this.relayEvents(this.store, ['clear']);


        this.pagingBar = new Ext.PagingToolbar({
            pageSize: this.pageSize,
            store: this.store
        });


        this.sortButton = new Ext.Button({
            text: '',
            cls: 'button',
            tooltip: this.sortTooltipConfig,
            menu: { items: [{ text: ''}] },
            disabled: true,
            hidden: true
        });


        this.printButton = new Ext.menu.Item({
            text: this.printButtonText,
            handler: this.printPage,
            scope: this,
            disabled: true
        });

        this.exportButton = new Ext.menu.Item({
            text: this.exportButtonText,
            handler: this.exportResultsToCsv,
            scope: this,
            disabled: true
        });

        this.clearButton = new Ext.menu.Item({
            text: this.clearButtonText,
            handler: function() {
                this.clear();
            },
            scope: this,
            disabled: false
        });

        // only add the print and export buttons of a handler function is supplied
        var menuItems = [];
        this.printPage != null ? menuItems.push(this.printButton) : null;
        this.exportResultsToCsv != null ? menuItems.push(this.exportButton) : null;
        menuItems.push(this.clearButton);
        this.toolsButton = new Ext.SplitButton({
            text: this.optionsButtonText,
            //handler: optionsHandler, // handle a click on the button itself

            menu: new Ext.menu.Menu({
                items: menuItems // these items will render as dropdown menu items when the arrow is clicked:
            })
        });


        Ext.apply(this, {
            //put non-overidable "private" objects here
            border: false,
            Expander: new FGI.grid.DynamicRowExpander({
                autoLoad: {
                    url: '',
                    idField: ''
                }
            }),
            enableHdMenu: false,
            remoteUrl: '',
            sortField: '',
            //id: 'searchresultsgrid',
            bbar: this.pagingBar,
            tbar: new Ext.Toolbar({
                hidden: !this.showTopToolbar,
                items: [
                    '<span>' + this.sortLabel + '</span>',
                    this.sortButton,
                    '->',
                    this.toolsButton
                ]
            })
        });


        // set the default colum model (colModel is required during init)
        for (var searchType in this.searchResultTypes) {
            if (this.searchResultTypes[searchType].isDefault) {
                this.colModel = this.configureColumnModel(this.searchResultTypes[searchType].title, 'address', this.searchResultTypes[searchType].titleRenderer);
                this.store.reader = this.searchResultTypes[searchType].reader;
                this.setSortFields(searchType);
                this.searchType = this.searchResultTypes[searchType].type;
                break;
            }
        }


        this.plugins = this.Expander;

        FGI.widgets.SearchResults.superclass.initComponent.apply(this, arguments);
    },
    
    clear: function(){
        this.store.removeAll();
        this.resetPagingToolbar();
    },

    setSearchType: function(type) {
        var found = false;
        for (var searchType in this.searchResultTypes) {
            if (this.searchResultTypes[searchType].type == type) {
                this.clear();
                this.searchType = type;
                this.Expander.autoLoad.url = this.searchResultTypes[searchType].expanderUrl;
                this.Expander.autoLoad.idField = this.searchResultTypes[searchType].expanderIdField;
                this.cm = this.configureColumnModel(this.searchResultTypes[searchType].title, 'address', this.searchResultTypes[searchType].titleRenderer);
                this.store.reader = this.searchResultTypes[searchType].reader;
                // Need to do this to use the new column model, that's it
                this.reconfigure(this.store, this.cm);
                this.setSortFields(searchType);

                found = true;
                break;
            }
        }
        if (!found) {
            throw ("FGI Error in FGI.widgets.SearchResults: Matching search results type not found for : " + type);
        }
    },

    // updates the widget store with a new url and reader definition
    doSearch: function(url) {
        this.expand();

        this.remoteUrl = url;

        this.store.proxy.conn.url = url + '&sortby=' + this.sortField;
        //this.store.reader = reader;

        var pagingToolbar = this.getBottomToolbar();
        pagingToolbar.bind(this.getStore());
        pagingToolbar.changePage(1);
    },


    // adds records to the search results grid, replacing any existing results 
    // use this method when you want to use a store with a 
    // fixed (not loaded from a URL) number of records
    addRecords: function(records, url) {
        this.expand();

        this.store.removeAll();
        this.store.add(records);
        this.store.proxy.conn.url = url + '&sortby=' + this.sortField;

        this.remoteUrl = url;

        this.resetPagingToolbar();
    },

    resetPagingToolbar: function() {
        // Manually set the pagingToolbar to page 1 of 1
        var pagingToolbar = this.getBottomToolbar();
        pagingToolbar.cursor = 0;
        pagingToolbar.afterTextEl.el.innerHTML = 'of 1';
        pagingToolbar.field.dom.value = 1;
        pagingToolbar.first.setDisabled(true);
        pagingToolbar.prev.setDisabled(true);
        pagingToolbar.next.setDisabled(true);
        pagingToolbar.last.setDisabled(true);
    },


    // helper method
    configureColumnModel: function(colheader, titleIndex, titleRenderer) {
        return new Ext.grid.ColumnModel([
            this.Expander,
            { id: 'resultscolheader',
                header: colheader,
                width: 250,
                sortable: true,
                dataIndex: titleIndex,
                renderer: titleRenderer
            }
        ]);
    },


    onAfterUpdate: function() {
        this.fireEvent('afterupdate', this.searchType, this.store.data);
        if (this.store.data.length > 0) {
            this.printButton.enable();
            this.exportButton.enable();
            this.sortButton.enable();
        } else {
            this.sortButton.disable();
            this.exportButton.disable();
            this.printButton.disable();
        }
    },

    setSortFields: function(searchType) {
        if (this.searchResultTypes[searchType].sortFields.length > 0) {
            this.sortButton.show();
            this.sortButton.menu.removeAll();
            for (var item = 0; item < this.searchResultTypes[searchType].sortFields.length; item++) {
                var sortField = this.searchResultTypes[searchType].sortFields[item];
                var menuItem = this.sortButton.menu.addMenuItem({ text: sortField.text });
                var createHandler = function(searchType, item) {
                    return function() {
                        this.sortButton.setText(this.searchResultTypes[searchType].sortFields[item].text);
                        this.sortField = this.searchResultTypes[searchType].sortFields[item].id;
                        this.doSearch(this.remoteUrl);
                    };
                };
                menuItem.setHandler(createHandler(searchType, item), this);
                if (item == 0 || sortField.isDefault) {
                    this.sortButton.setText(sortField.text);
                    this.sortField = sortField.id;
                }
            }
        } else {
            this.sortButton.hide();
            this.sortField = '';
        }
    }
});
