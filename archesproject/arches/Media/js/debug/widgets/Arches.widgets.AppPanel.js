/*
ARCHES - a program developed to inventory and manage immovable cultural heritage.
Copyright (C) 2013 J. Paul Getty Trust and World Monuments Fund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

Ext.define('Arches.widgets.AppPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.arches-widgets-apppanel',

    i18n: {
        newEntityButtonText: 'Add New Asset',
        selectLayersMapsButtonText: 'Layers/Maps',
        layerListTitle: 'Map Layers',
        layerListSubTitle: 'Turn visibility of layers on and off',
        layerListButtonText: 'Map</br>Layers'
    },

    border: false,
    id: 'app-panel',
    style: 'border-bottom: 6px solid #616161;',

    initComponent: function () {
        this.addEvents({
            'newentityclicked': true
        });

        this.basemapSelector = Ext.create('Arches.widgets.BasemapSelector', {
            containerConfig: {
                i18n: {
                    title: 'Basemaps',
                    subtitle: 'Select a map from the list',
                    buttonText: 'Basemaps'
                },
                buttonIconCls: 'glyph-aerial-switch'
            },
            listeners: {
                'basemapselected': this.updateBaseMap,
                scope: this
            }
        });

        this.layerList = Ext.create('Arches.widgets.LayerList', {
            i18n: {
                backButtonText: 'Back',
                showAllButtonText: 'Show All',
                hideAllButtonText: 'Hide All'
            },
            id: 'legend-layer-list',
            containerConfig: {
                i18n: {
                    title: this.i18n.layerListTitle,
                    subtitle: this.i18n.layerListSubTitle,
                    buttonText: this.i18n.layerListButtonText
                },
                buttonIconCls: 'glyph-layers-switch'
            }
        });

        this.searchResults = Ext.create('Arches.widgets.SearchResults', {
            containerConfig: {
                i18n: {
                    title: 'Search Results',
                    subtitle: '',
                    buttonText: 'Search</br>Results'
                },
                buttonIconCls: 'glyph-magnify-switch'
            },
            listeners: {
                'itemmouseenter': function(view, record, item) {
                    this.mapPanel.setSearchResultRenderIntent(record, 'temporary');
                },
                'itemmouseleave': function(view, record, item) {
                    this.mapPanel.setSearchResultRenderIntent(record, 'default');
                },
                'itemclick': function (view, record, item, index, e) {
                    if (Ext.get(e.getTarget('.view-report'))) {
                        this.showReport(record.get('entityTypeId'), record.get('entityId'));
                    } else if (Ext.get(e.getTarget('.edit-entity'))) {
                        this.editEntity(record.get('entityId'));
                    } else if (Ext.get(e.getTarget('.zoom-to-entity'))) {
                        var reader = new OpenLayers.Format.WKT({
                            'internalProjection': new OpenLayers.Projection("EPSG:900913"),
                            'externalProjection': new OpenLayers.Projection("EPSG:4326")
                        });
                        var geom = record.getGeometry();
                        var feature = reader.read(geom);
                        var xy = [];
                        xy.push(feature.geometry.getCentroid().x);
                        xy.push(feature.geometry.getCentroid().y);
                        this.mapPanel.map.setCenter(xy,this.mapPanel.map.getZoomForExtent(feature.geometry.getBounds()) - 1);
                    }
                },
                'resultscleared': function () {
                    this.mapPanel.updateSearchResults([]);
                },
                scope: this
            }
        });

        this.entityWorkflowController = Ext.create('Arches.contollers.EntityWorkflow', {
            containerConfig: {
                i18n: {
                    title: 'Add New Resource',
                    subtitle: 'Select a resource from the list',
                    buttonText: 'Add/Edit</br>Resource'
                },
                buttonIconCls: 'glyph-tower-switch',
                hideButton: true
            },
            listeners: {
                'dataupdated': function () {
                    Ext.each(this.mapPanel.map.layers, function(layer){
                        if(layer.name === this.entityWorkflowController.assetentitytypeid){
                            layer.strategies[0].update({force:true});
                        }
                    },this);
                },
                'start': function () {
                    this.legendPanel.setWidth(604);
                    this.legendPanel.contentContainer.setWidth(this.legendPanel.getWidth()-80);
                },
                'end': function () {
                    this.entityWorkflowController.addNewEntity();
                    this.entityWorkflowController.ownerCt.updateTitle(
                        this.entityWorkflowController.containerConfig.i18n.title,
                        this.entityWorkflowController.containerConfig.i18n.subtitle);
                    this.legendPanel.contentContainer.setWidth(this.legendPanel.expandedWidth-80);
                    this.legendPanel.setWidth(this.legendPanel.expandedWidth);
                },
                scope: this
            }
        });

        this.legendPanel = Ext.create('Arches.widgets.LegendPanel', {
            region: 'east',
            contentChildren: [
                this.basemapSelector,
                this.layerList,
                this.searchResults,
                this.entityWorkflowController
            ],
            listeners: {
                'beforeexpand': function(panel, child) {
                    var proceed = true;
                    if (this.legendPanel.isExpanded && this.entityWorkflowController.workflowRunning) {
                        if (this.entityWorkflowController.editsPending === true) {
                            proceed = false;
                            Ext.Msg.show({
                                 title: 'Unsaved Changes',
                                 msg: 'You have unsaved changes that will be lost if you exit this editing session.  Are you sure that you would like to proceed?',
                                 buttons: Ext.Msg.YESNO,
                                 fn: function (btnId) {
                                    if (btnId === 'yes') {
                                        this.entityWorkflowController.endWorkflow();
                                        this.legendPanel.expand(child);
                                    }
                                 },
                                 scope: this
                            });
                        } else {
                            this.entityWorkflowController.endWorkflow();
                        }
                    }
                    return proceed;
                },
                'beforecollapse': function(panel, child) {
                    var proceed = true;
                    if (child === this.entityWorkflowController && this.entityWorkflowController.workflowRunning) {
                        if (this.entityWorkflowController.editsPending === true) {
                            proceed = false;
                            Ext.Msg.show({
                                 title: 'Unsaved Changes',
                                 msg: 'You have unsaved changes that will be lost if you exit this editing session.  Are you sure that you would like to proceed?',
                                 buttons: Ext.Msg.YESNO,
                                 fn: function (btnId) {
                                    if (btnId === 'yes') {
                                        this.entityWorkflowController.endWorkflow();
                                        this.legendPanel.collapse();
                                    }
                                 },
                                 scope: this
                            });
                        } else {
                            this.entityWorkflowController.endWorkflow();
                        }
                    }
                    return proceed;
                },
                scope: this
            }
        });

        this.layerList.on({
            'removelayerclicked': function (record) {
                this.mapPanel.removeLayer(record);
            },
            'layersreindexed': function () {
                var index = this.mapPanel.map.layers.length - 1;
                this.mapPanel.map.setLayerIndex(this.mapPanel.searchResultsLayer, index);
            },
            scope: this
        });

        this.appHeader = Ext.create('Arches.widgets.AppHeader', {
            listeners: {
                'userchanged': function (user) {
                    this.fireEvent('userchanged', user);
                },
                'beforesignout': function () {
                    var proceed = true;
                    if (this.legendPanel.isExpanded && this.legendPanel.activeLegendTab.contentContainer === this.entityWorkflowController) {
                        if (this.entityWorkflowController.editsPending === true) {
                            proceed = false;
                            Ext.Msg.show({
                                 title: 'Unsaved Changes',
                                 msg: 'You have unsaved changes that will be lost if you sign out this editing session.  Are you sure that you would like to sign out?',
                                 buttons: Ext.Msg.YESNO,
                                 fn: function (btnId) {
                                    if (btnId === 'yes') {
                                        this.entityWorkflowController.endWorkflow();
                                        this.appHeader.signOut();
                                    }
                                 },
                                 scope: this
                            });
                        } else {
                            if (this.entityWorkflowController.workflowRunning) {
                                this.entityWorkflowController.endWorkflow();
                            }
                            this.legendPanel.collapse();
                        }
                    }
                    return proceed;
                },
                scope: this
            }
        });

        this.appHeader.search.on('searchbuttonclicked', function(value) {
            this.doSearch(value);
        }, this);

        var collapseSimpleSearchSuggestions = Ext.Function.bind(this.collapseSearchSuggestions, this);

        this.mapPanel = Ext.create('Arches.widgets.MapPanel', {
            region: 'center',
            baseLayer: this.basemapSelector.store.findRecord('onMap', true).get('layer'),
            listeners: {
                'layerAdded': function (layerRecord) {
                    this.layerList.store.insert(0, [layerRecord]);
                },
                'layerRemoved': function (layerRecord) {
                    this.layerList.store.remove(layerRecord);
                },
                'searchresultover': function (mapPanel, feature) {
                    var record = this.searchResults.store.find('entityId', feature.attributes.entityId);
                    var node = this.searchResults.list.getNode(record);
                    this.searchResults.list.highlightItem(node);
                },
                'searchresultout': function (mapPanel, feature) {
                    this.searchResults.list.clearHighlight();
                },
                'showreportclicked': function (entitytypeid, entityid){
                    this.showReport(entitytypeid, entityid);
                },
                'editentityclicked': this.editEntity,
                scope: this
            },
            collapseSearchSuggestions: collapseSimpleSearchSuggestions
        });

        var layerGroupStore = Ext.create('Ext.data.Store', {
            model: 'Arches.models.LayerGroup',
            data: Arches.i18n.MapLayers,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'layerGroups'
                }
            },
            sorters: [
                {
                    property : 'name',
                    direction: 'ASC'
                }
            ]
        });

        layerGroupStore.each(function(groupRecord) {
            var layerStore = groupRecord.layers();
            layerStore.each(function(layerRecord) {
                this.mapPanel.addLayer(layerRecord);
            }, this);
        }, this);

        this.layerList.ownerCt.on({
            'activate': function () {
                this.layerList.groupFilterControls.items.first().toggle(true);
            },
            single: true,
            scope: this
        });

        this.searchResults.store.on('load', function(store, records) {
            this.mapPanel.updateSearchResults(records);
        }, this);


        this.reportsPanel = Ext.create('Ext.panel.Panel',  {
            ui: 'fgi_panel_gray',
            floating: true,
            modal: true,
            width: 950,
            height: 900,
            border: false,
            layout: 'fit',
            listeners: {
                'show': function () {
                    this.reportsPanel.updateSize();
                },
                scope: this
            },
            updateSize: function () {
                if(this.rendered) {
                    this.setHeight(Ext.getBody().getHeight()-100);
                    this.alignTo(Ext.getBody(), 'c-c');
                }
            }
        });

        this.printReportsPanel = Ext.create('Ext.panel.Panel',  {
            ui: 'fgi_panel_gray',
            floating: true,
            modal: true,
            width: 950,
            height: 900,
            border: false,
            layout: 'fit'
        });


        Ext.apply(this, {
            items: [
                this.appHeader,
                this.mapPanel,
                this.legendPanel
            ],
            layout: 'border'
        });

        this.on({
            'afterlayout': function () {
                this.appHeader.logo.show();
                this.mapPanel.infoBar.show();
                this.mapPanel.on({
                    'afterlayout': function () {
                        this.mapPanel.infoBar.alignTo(this.mapPanel, 'bl-bl', this.mapPanel.infoBarOffsets);
                        this.mapPanel.infoBar.setWidth(this.mapPanel.getWidthForInfoBar());
                    },
                    'activate': function () {
                        this.mapPanel.infoBar.show();
                    },
                    'deactivate': function () {
                        this.mapPanel.infoBar.hide();
                    },
                    scope: this
                });
                this.mapPanel.doLayout();
                this.on({
                    'deactivate': function () {
                        this.mapPanel.infoBar.hide();
                        this.appHeader.logo.hide();
                    },
                    'activate': function () {
                        this.mapPanel.infoBar.show();
                        this.appHeader.logo.show();
                        // bit of a hack to ensure the map is sized properly
                        this.mapPanel.setSize(0,0);
                        this.mapPanel.doLayout();
                    },
                    scope: this
                });
            },
            single: true,
            scope: this
        });

        this.callParent(arguments);
    },

    collapseSearchSuggestions: function(){
        this.appHeader.search.searchCombo.collapse();
    },

    doSearch: function (value){
        this.legendPanel.expand(this.searchResults);
        if (value) {
            this.searchResults.query(value);
        }
    },

    printReport: function(report){
        var archesCss = '<link rel="stylesheet" type="text/css" href=' + Arches.config.Urls.mediaPath + 'css/Arches.css>'
        var extCss = '<link rel="stylesheet" type="text/css" href=' + Arches.config.Urls.mediaPath + 'js/resources/css/my-ext-theme.css>'
        var openLayersCss = '<link rel="stylesheet" type="text/css" href=' + Arches.config.Urls.mediaPath + 'js/ui_frameworks/OpenLayers-2.12/theme/default/style.css>'
        var sections = ['<head>' + extCss + openLayersCss + archesCss + '</head><body>'];
        Ext.each(report.sectionsPanel.items.items, function(section) {
            console.log(section.getPrintHtml());
            sections.push(section.getPrintHtml());
        });
        sections.push('</body>')
        Ext.ux.Printer.print(sections, true);
    },

    showReport: function(entitytypeid, entityid) {
        this.reportsPanel.removeAll();
        if (this.report) {
            this.report.destroy();
        }
        this.report = Arches.factories.Report.create(entitytypeid, {
            entitytypeid: entitytypeid,
            entityid: entityid,
            forprint: false,
            printhtml: {}
        });

        this.report.on('closereportclicked', function () {
            this.reportsPanel.hide();
        }, this);

        this.report.on('printreportclicked', function () {
            //this.createPrintReport(entitytypeid, entityid)
            this.printReport(this.report)
        }, this);

        this.reportsPanel.add(this.report);
        this.reportsPanel.show();
        this.reportsPanel.doLayout();
    },

    updateBaseMap: function(layerRecord) {
        var layer = layerRecord.get('layer');
        this.basemapSelector.store.each(function(record) {
            record.set('active', false);
            record.set('onMap', false);
        }, this);
        layerRecord.set('active', true);
        layerRecord.set('onMap', true);
        if (this.mapPanel.baseLayer !== layer) {
            this.mapPanel.setBaseLayer(layerRecord.get('layer'));
        }
    },

    editEntity: function (entityId) {
        if (this.entityWorkflowController.workflowRunning) {
            if (this.entityWorkflowController.editsPending) {
                Ext.Msg.alert('Currently Editing', 'You can only modify one entity at a time.  Please finish your current edits before editing another entity.');
                return;
            } else {
                this.entityWorkflowController.endWorkflow();
            }
        }

        this.legendPanel.expand(this.entityWorkflowController);
        this.entityWorkflowController.loadEntity(entityId);
    },

    setUser: function (user) {
        this.appHeader.setUser(user);
        if (user && user.is_active) {
            if (this.ownerCt.getLayout().getActiveItem() === this) {
                this.entityWorkflowController.toggleButton.show();
            } else {
                this.on({
                    'activate': function () {
                        this.entityWorkflowController.toggleButton.show();
                    },
                    single: true,
                    scope: this
                });
            }
        } else {
            this.entityWorkflowController.toggleButton.hide();
        }
        this.searchResults.list.refresh();
        this.mapPanel.selectPopup.hide();
    }
});