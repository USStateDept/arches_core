/// <reference path="../../Ext-2.2/adapter/ext/ext-base.js" />
/// <reference path="../../Ext-2.2/ext-all-debug.js" />


/** 
* @class FGI.widgets.LibraryBrowser
* @extends Ext.panel.Panel
* @requires Ext 4.0.0
* <p>widget for browsing through groups of saved maps</p>
*/
Ext.namespace('FGI', 'FGI.widgets');

Ext.define('FGI.widgets.LibraryBrowser', {
    extend: 'Ext.Panel',
    alias: 'fgi-widgets-librarybrowser',

    /**
    * @property 
    */
    layout: 'border',

    /**
    * @property 
    */
    mapGroupsHaveBeenRequested: false,

    config: {
        /**
        * @property 
        */
        mapsStore: null,

        /**
        * @property 
        */
        mapsTpl: null,

        /**
        * @property 
        */
        mapGroupsView: null,

        /**
        * @property 
        */
        tagsView: null,

        /**
        * @property 
        */
        currentMapsInfoTpl: null

    },

    initComponent: function () {


        // create top panel for holding the map groups as well as the text box for filtering
        this.mapGroupsPanel = new Ext.Panel({
            region: 'north',
            border: false,
            height: 60,
            layout: 'border',
            items: [
                new Ext.Panel({
                    region: 'west',
                    width: 150,
                    border: false,
                    html: '<div style="float:left">' +
                            '<h1 style="height: 30px;" id="maplibrary-name">Maps:</h1>' +
                          '</div>'
                }),
                new Ext.Panel({
                    region: 'center',
                    border: false,
                    items: [
                       this.mapGroupsView
                    ]
                }),
                new Ext.Panel({
                    region: 'east',
                    width: 450,
                    border: false,
                    html: '<div style="float:right" id="maplibrary-search-area" class="search-area">' +
                          '</div>'
                })
            ]
        });




        this.mapGroupsView.on({
            selectionchange: function (view, selection) {
                //Fired when a user selects a different map group.  Should repopulates the map view store with new data for that group as well as the tag store
                if (selection.length > 0) {
                    this.mapsStore.getProxy().extraParams.groupId = selection[0].data.id;
                    this.tagsView.getStore().getProxy().extraParams.groupId = selection[0].data.id;
                    this.refreshMapsAndTags();
                }
            },
            scope: this
        });


        this.mapGroupsView.getStore().on({
            load: function () {
                this.mapGroupsHaveBeenRequested = true;
            },
            scope: this,
            single: true
        });



        this.currentMapsInfoPanel = new Ext.Panel({
            region: 'west',
            border: false,
            width: 200,
            tpl: this.currentMapsInfoTpl
        });


        // create the map view panel 
        this.mapsViewGrid = Ext.create('Ext.grid.Panel', {
            hideHeaders: true,
            region: 'center',
            store: this.mapsStore,
            verticalScrollerType: 'paginggridscroller',
            loadMask: true,
            disableSelection: true,
            invalidateScrollerOnRefresh: false,
            border: false,
            viewConfig: {
                trackOver: true
            },
            columns: [{
                id: 'MapLibraryMapData',
                flex: 1,
                xtype: 'templatecolumn',
                tpl: this.mapsTpl,
                sortable: false
            }],
            tbar: new Ext.Panel({
                height: 60,
                border: false,
                layout: 'border',
                items: [
                    this.currentMapsInfoPanel,
                    new Ext.Panel({
                        region: 'center',
                        border: false,
                        html: ''
                    })
                ]
            })
        });


        this.mapsStore.on({
            load: function () {
                //Update the currentMapsInfoTpl with the current map group and total map count
                this.currentMapsInfoPanel.update({ "GroupName": this.mapGroupsView.getSelectionModel().getSelection()[0].data.DisplayValue, "TotalCount": this.mapsStore.getProxy().getReader().rawData.returnObj.TotalCount });
            },
            scope: this
        });


        //Create the tag cloud panel
        this.tagCloudPanel = new Ext.Panel({
            region: 'west',
            border: false,
            width: 250,
            items: [
                this.tagsView
            ]/*,
            tbar: new Ext.Panel({
                height: 80,
                border: false,
                html: '<div style="height:80px;vertical-align:bottom;">Map Tags</div>'
            })*/
        });


        // add panels to the container
        Ext.apply(this, {
            //non-overidable objects
            items: [
                this.mapGroupsPanel,
                this.mapsViewGrid,
                this.tagCloudPanel
            ]
        });

        //Setup filter text box
        this.on({
            afterlayout: function () {
                this.mapLibrarySearchStore = Ext.create('Ext.data.Store', {
                    fields: ['id', 'name'],
                    data: [
                        { "id": 1, "name": "Map 1" },
                        { "id": 2, "name": "Map 2" },
                        { "id": 3, "name": "Map 3" }
                    ]
                });

                this.mapLibrarySearch = Ext.create('Ext.form.ComboBox', {
                    fieldLabel: '',
                    store: this.mapLibrarySearchStore,
                    queryMode: 'local',
                    displayField: 'name',
                    //valueField: 'abbr',
                    width: 400,
                    cls: 'x-form-search-field',
                    triggerCls: 'x-form-search-trigger',
                    renderTo: 'maplibrary-search-area',
                    emptyText: 'Find a map',
                    style: {
                        fontSize: '24px'
                    }
                });
            },
            scope: this,
            single: true
        });

        this.callParent(arguments);
    },
    refreshMapsAndTags: function () {
        this.mapsStore.guaranteeRange(0, this.mapsStore.pageSize - 1);
        this.mapsStore.load();
        this.tagsView.getStore().load();
    }
});

// register xtype to allow for lazy initialization
//Ext.reg('fgi-widgets-librarybrowser', 'FGI.widgets.LibraryBrowser');