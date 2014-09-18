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

Ext.define('Arches.reports.Default', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.arches-reports-default',


    title: 'Report',
    entityid: null,
    entitytypeid: null,
    ui: 'fgi_panel_gray_transparent',
    border: false,
    layout: 'fit',
    preventHeader: true,

    headerTpl: '<div style="float:left;width:36px;"><img src="{mediaPath}images/AssetIcons/{icon}.png"></img></div>' +
            '<div style="font-size: 16px;padding-top:2px;line-height:16px;color: #2B2B28;">{primaryName}</div><div class="headerLinks"></div>',

    sections: [],
    sectionsLayout: 'auto',
    forprint: false,
    printhtml: {},

    printReport: function(){
        if(this.forprint === true){
        var testhtml = Ext.DomQuery.selectNode('#' + this.sectionsPanel.body.dom.id + '.x-panel-body');
        Ext.ux.Printer.print([testhtml], true);
        }
    },

    initComponent: function(){
        this.sectionsPanel = Ext.create('Ext.panel.Panel', {
            ui: 'fgi_panel_white',
            bodyCls: 'report',
            autoScroll: true,
            layout: this.sectionsLayout, 
            html: '<div class="reports-loading">Loading Report...</div>',
            loader: {
                url: Arches.config.Urls.entity + this.entityid + '?labeled=true',
                renderer: 'data',
                autoLoad: false,
                scope: this,
                callback: this.printReport,
                listeners:{
                    'load': function(loader, response, options, eOpts ){
                        var entityJSON = Ext.decode(response.responseText);

                        if(entityJSON !== undefined){
                            var entitygraph = new Arches.data.Entity();
                            entitygraph.load(entityJSON);   

                             var headerJson = {
                                mediaPath: Arches.config.Urls.mediaPath,
                                icon: Arches.config.Tpls.functions.getPropertyValueFromEntityTypeId(entityJSON.entitytypeid, "icon"),
                                primaryName: entitygraph.getPrimaryDisplayName()
                            };

                            this.headerContent.update(headerJson);
                            var headerLinks = Ext.get(this.headerContent.getEl().query('div.headerLinks')[0]);
                            var linkElements = '';

                            Ext.each(this.sections, function(section, index){
                                if (!section.config) {
                                    section.config = {};
                                }
                                var newSection = Ext.create(section.name, Ext.apply(section.config, {
                                    entity: entitygraph,
                                    cls: 'reportSection',
                                    report: this
                                }));
                                this.sectionsPanel.add(newSection);
                                this.printhtml[section.name] = newSection.printhtml;
                                var sectionLink = Ext.get(document.createElement('a'));
                                sectionLink.applyStyles({
                                    'cursor': 'pointer'
                                });
                                sectionLink.update(newSection.i18n.title);
                                sectionLink.on({
                                    'click': function () {
                                        newSection.getEl().scrollIntoView(this.sectionsPanel.body);
                                        newSection.getEl().highlight();
                                    },
                                    scope: this
                                });
                                headerLinks.appendChild(sectionLink);
                                if (this.sections.length - 1 > index){
                                    var spacer = Ext.get(document.createElement('span'));
                                    spacer.update(' | ');
                                    spacer.applyStyles({
                                        'padding-right': '5px',
                                        'padding-left': '5px'
                                    });
                                    headerLinks.appendChild(spacer);
                                }
                                
                            }, this);
                        }
                    },
                    scope: this
                }
            }
        });

        this.sectionsPanel.loader.load();
        
        this.headerContent = Ext.create('Ext.container.Container', {
            flex: 1,
            height: 42,
            tpl: this.headerTpl
        });

        this.headerRegion = Ext.create('Ext.container.Container', {
            dock: 'top',
            cls: 'legend-info-header',
            layout: {
                type: 'hbox'
            },
            items: [
                this.headerContent,
                Ext.create('Ext.button.Button',{
                    ui: 'fgi_button_white',
                    tooltip: 'Print Version',
                    scale: 'medium',
                    iconAlign: 'top',
                    text: ' ',
                    iconCls: 'glyph-printer',
                    handler: function () {
                        this.fireEvent('printreportclicked');
                    },
                    scope: this,
                    width: 32,
                    height: 32,
                    style: 'margin-right:5px'
                }),
                Ext.create('Ext.button.Button',{
                    ui: 'fgi_button_white',
                    tooltip: 'Close',
                    scale: 'medium',
                    iconAlign: 'top',
                    text: ' ',
                    iconCls: 'glyph-x',
                    handler: function () {
                        this.fireEvent('closereportclicked');
                    },
                    scope: this,
                    width: 32,
                    height: 32
                })
            ],
            height: 42
        });

        this.dockedItems = [this.headerRegion];
        this.items = [this.sectionsPanel];

        this.callParent(arguments);
    }
});