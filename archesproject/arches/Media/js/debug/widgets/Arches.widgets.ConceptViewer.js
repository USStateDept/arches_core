Ext.define('Arches.widgets.ConceptViewer', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.arches-widgets-conceptviewer',

    i18n: {
        closeButtonText: 'Cancel',
        selectTermButtonText: 'Select Term',
        heirarchyHeader: 'Heirarchy:',
        termHeader: 'Terms:',
        termMetadataHeader: 'Term:',
        associativeConceptsHeader: 'Associative Concepts:',
        scopeNoteHeader: 'Scope Note:',
        prefLabel: 'preferred',
        conceptIdLabel: 'ConceptId:',
        keyValuePairsHeader: 'Key/Value Pairs:',
        geometryHeader: 'Geometry:',
        noDataMessage: 'None defined',
        geometryLabel: 'WKT(Well Known Text):',
        minDateLabel: 'From Date:',
        maxDateLabel: 'To Date:'
    },

    ui: 'fgi_panel_gray',
    style: 'background-color:#D2D2D2;',
    floating: true,
    modal: true,
    width: 850,
    height: 680,
    border: false,
    layout: 'fit',
    titleConfig: {
        entitytypeid: null,
        title: '',
        subtitle: ''
    },
    rawConceptData: {},

    initComponent: function () {
        this.addEvents({
            'termselected': true
        });

        this.treeStore = Ext.create('Ext.data.TreeStore', {
            model: 'Arches.models.ConceptTree',
            defaultRootProperty: 'subconcepts',
            proxy: {
                type: 'memory',
                reader: {
                    type: 'concepttreejson'
                }
            },
            root:{}
        });
        
        this.treeStore.fillNode(
            this.treeStore.getRootNode(),
            this.treeStore.proxy.reader.read(this.rawConceptData).records
        );

        this.conceptTreeViewer = Ext.create('Ext.tree.Panel',{
            flex: 1,
            bodyStyle: 'border:solid lightgray !important; border-width: 1px 1px 0px 1px !important; color: #666666;',
            sortableColumns: false,
            useArrows: true,
            hideHeaders: true,
            rootVisible: false,
            viewConfig:{
                style: 'overflow-x:hidden; overflow-y:scroll'
            },
            columns: [{
                xtype: 'treecolumn',
                flex: 1,
                sortable: false,
                dataIndex: 'displaylabel'
            }],
            layout: {
                type: 'fit'
            },
            store: this.treeStore,
            height: 450,
            width: 300,
            listeners:{
                'select': function(view, record){
                    var prefLabel;
                    this.termViewer.update(record);
                    prefLabel = this.termList.store.findRecord('type', 'prefLabel');
                    this.termList.getSelectionModel().select(prefLabel);
                    if(record.metadataStore.count() > 0){
                        Ext.getCmp(this.conceptMetadata.tabControlId).enable();
                    }else{
                        Ext.getCmp(this.conceptMetadata.tabControlId).disable();
                    }
                },
                'beforeselect': function (view, record) {
                    return record.get('selectable');
                },
                scope: this
            }
        });

        this.termList = Ext.create('Ext.view.View', {
            store: Ext.create('Ext.data.Store',{
                model: 'Arches.models.ConceptLabel'
            }),
            tpl: Ext.create('Ext.XTemplate',
                '<tpl for="."><div class="term-item" style=""><span class="term-value">{value}</span> <span class="term-lang" style="font-weight:{[values.type === "prefLabel" ? "bold": "normal"]};">({[values.type === "prefLabel" ? "' + this.i18n.prefLabel + ', ": ""]}{language})</span></div></tpl>'
            ),
            itemSelector: 'div.term-item',
            emptyText: 'No term selected',
            width:300,
            height: 200,
            autoScroll: true,
            listeners:{
                'itemdblclick': function(view, record, item, index, e, eOpts){
                    this.fireEvent('termselected', record.get('id'));
                },
                scope: this
            }
        });

        this.termList.getSelectionModel().on({
            'selectionchange': function () {
                this.selectTermButton.enable();
            },
            scope: this
        });

        this.termViewer = Ext.create('Ext.container.Container',{
            style: 'background-color: white; padding: 20px;',
            layout: {
                type: 'fit'
            },
            flex: 5,
            items: [
                Ext.create('Ext.container.Container', {
                    layout: {
                        type: 'vbox',
                        align: 'stretch'
                    },
                    items:[{
                        xtype: 'container',
                        layout:{
                            type:'hbox'
                        },
                        items:[{
                                xtype: 'container',
                                cls: 'section-header',
                                html: this.i18n.termHeader
                            },{
                                xtype:'tbspacer',
                                flex: 1
                            },{
                                xtype: 'container',
                                flex: 4,
                                itemId: 'conceptIdHeader',
                                cls: 'section-header',
                                style: 'font-size: 12px;text-align:right;',
                                tpl: Ext.create('Ext.XTemplate',this.i18n.conceptIdLabel + ' {conceptId}'),
                                data:{conceptId: ''}
                            }]
                        },{
                            xtype: 'container',
                            html: '<hr>'
                        },
                        this.termList,
                        {
                            xtype: 'container',
                            cls: 'section-header',
                            html: this.i18n.associativeConceptsHeader + '<hr>',
                            height: 100
                        },{
                            xtype: 'container',
                            cls: 'section-header',
                            html: this.i18n.scopeNoteHeader + '<hr>',
                        },{
                            xtype: 'container',
                            itemId: 'scopeNoteBody'
                        }
                    ]
                })
            ],
            update: function(record){
                var conceptId = record.get('id');
                this.down("component[itemId = 'conceptIdHeader']").update({conceptId:conceptId});
                this.down('dataview').bindStore(record.labelsStore);
                this.getScopeNote(conceptId);
            },
            getScopeNote: function(conceptid){
                Ext.Ajax.request({
                    url: Arches.config.Urls.concepts + conceptid,
                    params: {
                        full_graph: 'false',
                        fromdb: 'true'
                    },
                    method: 'GET',
                    success: function(response){
                        var concept = Ext.decode(response.responseText);
                        var notes = concept.hits.hits[0]._source.notes;
                        if (notes && notes.length > 0) {
                            this.down("component[itemId = 'scopeNoteBody']").update(notes[0].value);
                        }
                    },
                    scope: this
                });
            }
        });

        this.conceptMetadata = Ext.create('Ext.container.Container',{
            tabIconCls: 'glyph-rolodex',
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            items:[{
                xtype: 'container',
                style: 'background-color: white;padding:20px;',
                flex: 3,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                items:[{
                        xtype: 'container',
                        height: 30,
                        itemId: 'termMetatdataHeader',
                        cls: 'section-header',
                        tpl: Ext.create('Ext.XTemplate', this.i18n.termMetadataHeader +' {term}'),
                        data:{term: ''}
                    },{
                        xtype: 'container',
                        cls: 'section-header',
                        html: this.i18n.keyValuePairsHeader + '<hr>'
                    },{
                        xtype: 'dataview',
                        store: Ext.create('Ext.data.Store',{
                            model: 'Arches.models.ConceptMetadata'
                        }),
                        autoScroll: true,
                        height: 400,
                        cls: 'view-body',
                        tpl: new Ext.XTemplate(
                            '<tpl for=".">',
                            '<div class="term-item">',
                                '<span class="term-value">{[this.getTypeLabel(values.type)]}</span>',
                                '<span class="term-lang"> {value}</span>',
                            '</div>',
                            '</tpl>',
                            {
                                getTypeLabel: function(type){
                                    ret = type;
                                    switch (type){
                                        case 'geometry':
                                            ret = this.initialConfig.scope.i18n.geometryLabel;
                                            break;
                                        case 'minimum date':
                                            ret = this.initialConfig.scope.i18n.minDateLabel;
                                            break;
                                        case 'maximum date':
                                            ret = this.initialConfig.scope.i18n.maxDateLabel;
                                            break;
                                    }
                                    return ret;
                                },
                                scope: this
                            }
                        ),
                        itemSelector: 'div.term-item',
                        emptyText: this.i18n.noDataMessage
                    }
                ]
            },{
                xtype: 'container',
                style: 'background-color: white;padding:20px;',
                flex: 5,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                items:[{
                        xtype: 'container',
                        height: 30,
                        itemId: 'conceptIdHeader',
                        cls: 'section-header',
                        style: 'font-size: 12px;text-align:right;',
                        tpl: Ext.create('Ext.XTemplate',this.i18n.conceptIdLabel + ' {conceptId}'),
                        data:{conceptId: ''}
                    },{
                        xtype: 'container',
                        cls: 'section-header',
                        html: this.i18n.geometryHeader + '<hr>'
                    },{
                        xtype: 'container',
                        itemId: 'mapContainer',
                        height: 300
                    }
                ]
            }],
            listeners:{
                'activate': function(){
                    var selectedConcept = this.conceptTreeViewer.getSelectionModel().getSelection()[0];
                    if(selectedConcept){
                        if(selectedConcept.getPreferredTerms().length > 0){
                            this.conceptMetadata.down("component[itemId = 'termMetatdataHeader']").update({term: selectedConcept.getPreferredTerms()[0].get('value')});
                        }
                        this.conceptMetadata.down("component[itemId = 'conceptIdHeader']").update({conceptId:selectedConcept.get('id')});
                        this.conceptMetadata.down('dataview').bindStore(selectedConcept.metadataStore);
                        var wkt = selectedConcept.getMetadata('geometry');
                        if(wkt !== ''){
                            if(!this.map){
                               this.addMap(this.conceptMetadata.down("component[itemId = 'mapContainer']"));
                            }
                            var wktFormat = new OpenLayers.Format.WKT();
                            var feature = wktFormat.read(wkt);
                            feature.geometry.transform(new OpenLayers.Projection('EPSG:4326'), new OpenLayers.Projection('EPSG:900913'));
                            this.drawingLayer.addFeatures(feature);
                            this.map.zoomToExtent(feature.geometry.getBounds());
                        }
                    }
                },
                scope: this
            }
        });

        this.conceptListStore = Ext.create('Ext.data.Store', {
            model: 'Arches.models.ConceptList',
            proxy: {
                type: 'memory',
                reader: {
                    type: 'conceptlistjson',
                    root: 'hits.hits'
                }
            },
            sorters: [{
                property : 'sortorder',
                direction: 'ASC'
            },{
                property : 'value',
                direction: 'ASC'
            }]
        });

        this.conceptListStore.loadRawData(this.rawConceptData);

        this.conceptBrowser = Ext.create('Ext.container.Container', {
            tabIconCls: 'glyph-magnify',
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            items: [
                Ext.create('Ext.container.Container', {
                    flex: 3,
                    style: 'background-color: white;padding:20px;',
                    layout: {
                        type: 'vbox',
                        align: 'stretch'
                    },
                    items: [
                        {
                            xtype: 'container',
                            style: 'padding-bottom: 5px; font-size:16px; color: #666666',
                            html: this.i18n.heirarchyHeader
                        },
                        this.conceptTreeViewer,
                        {
                            xtype: 'container',
                            style: 'border: solid lightgray; border-width: 0px 1px 1px 1px; padding: 9px 3px 3px 3px;background-color: #EEEEEE',
                            layout: 'fit',
                            triggerCls: '',
                            items: [
                                Ext.create('Ext.form.ComboBox', {
                                    store: this.conceptListStore,
                                    triggerCls: 'x-form-search-trigger',
                                    triggerAction: 'query',
                                    queryMode: 'local',
                                    displayField: 'value',
                                    valueField: 'labelid',
                                    listeners: {
                                        'select': function (combo, records) {
                                            if (records.length > 0) {
                                                var treeRecord = this.treeStore.getNodeById(records[0].get('conceptid')),
                                                    field = 'id',
                                                    separator = '/',
                                                    path = [treeRecord.get(field)],
                                                    parent = treeRecord.parentNode;

                                                while (parent) {
                                                    path.unshift(parent.get(field));
                                                    parent = parent.parentNode;
                                                }
                                                path = separator + path.join(separator);

                                                this.conceptTreeViewer.expandPath(path);
                                                this.conceptTreeViewer.getSelectionModel().select(treeRecord);
                                            }
                                        },
                                        scope: this
                                    }
                                })
                            ]
                        }
                    ]
                }),
                this.termViewer
            ]
        });

        this.items = [
            Ext.create('FGI.widgets.SideTabPanel',{
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
                        this.close();
                    },
                    scope: this,
                    width: 46,
                    height: 34,
                    style: 'margin: 2px;'
                })],
                items: [
                    this.conceptBrowser,
                    this.conceptMetadata
                ]
            })
        ];

        this.selectTermButton = Ext.create('Ext.button.Button',{
            ui: 'fgi_button_white',
            style: 'margin-right:10px;',
            tooltip: this.i18n.selectTermButtonText,
            scale: 'medium',
            iconAlign: 'top',
            text: this.i18n.selectTermButtonText,
            handler: this.selectTerm,
            scope: this,
            height: 32,
            disabled: true
        });

        this.dockedItems = [
            Ext.create('Ext.container.Container',{
                dock: 'top',
                cls: 'legend-info-header',
                tpl: new Ext.XTemplate('<tpl if="entitytypeid">',
                        '<div style="float:left;width:40px;"><img src="' + Arches.config.Urls.mediaPath + 'images/AssetIcons/{[this.getPropertyValueFromEntityTypeId(values.entitytypeid, "icon")]}.png" id="ext-gen2524" style="vertical-align:middle; height:36px; width: 36px;"></div>',
                    '</tpl>',
                    '<div style="display:table-cell;vertical-align:middle;">',
                        '<span style="font-size:18px;">{title}</span></br><span style="font-size:14px;">{subtitle}</span>',
                    '</div>',
                    Arches.config.Tpls.functions),
                data: this.titleConfig,
                layout: {
                    type: 'fit'
                },
                height: 52
            }),
            Ext.create('Ext.container.Container', {
                dock: 'bottom',
                style: 'background-color: #EEEEEE;',
                layout: {
                    type: 'hbox',
                    align: 'middle',
                    pack: 'end'
                },
                items: [
                    Ext.create('Ext.button.Button',{
                        ui: 'fgi_button_white',
                        style: 'margin-right:10px;',
                        tooltip: this.i18n.closeButtonText,
                        scale: 'medium',
                        iconAlign: 'top',
                        text: this.i18n.closeButtonText,
                        handler: function () {
                            this.close();
                        },
                        scope: this,
                        height: 32
                    }),
                    this.selectTermButton
                ],
                height: 42
            })
        ];

        this.callParent(arguments);

        Ext.getCmp(this.conceptMetadata.tabControlId).disable();
    },

    selectTerm: function(){
       var record = this.termViewer.down('dataview').getSelectionModel().getSelection()[0];
       this.fireEvent('termselected', record.get('id'));
    },

    addMap: function (mapContainer) {
        var basemap = new Function(Ext.Array.filter(Arches.i18n.MapLayers.basemaps, function(layer) { return layer.active; })[0].layer)();
        
        this.map = new OpenLayers.Map(mapContainer.getEl().id);
        this.map.addLayer(basemap);

        var drawingStyle = new OpenLayers.Style({
            strokeWidth: 3,
            strokeOpacity: 0.5,
            strokeColor: '#4d90fe',
            fillColor: '#4d90fe',
            fillOpacity: 0.5
        });

        var drawingLayerStyle = new OpenLayers.StyleMap({
            'default': drawingStyle,
            'select': drawingStyle
        });

        this.drawingLayer = new OpenLayers.Layer.Vector("ConceptBoundary", {
            styleMap: drawingLayerStyle
        });

        this.drawingLayer.events.on({
            "beforefeatureadded": function(e) {
                this.drawingLayer.removeAllFeatures();
            },
            scope: this
        });

        this.map.addLayer(this.drawingLayer);

        this.on({
            'afterlayout': function () {
                this.map.updateSize();
            },
            scope: this
        });

        this.getEl().on({
            'scroll': function () {
                this.map.updateSize();
            },
            scope: this
        });
    }
});