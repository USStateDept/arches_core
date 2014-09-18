Ext.define('Arches.widgets.ScrollableReportSection',{
	alias: 'widget.arches-widgets-scrollablereportsection',
	extend: 'Ext.panel.Panel',
    
    sectionTitle: 'Scrollable Report Section',
    height: 185,
    cls: 'expandableTextArea',
    bodyStyle: 'padding: 0 15px 15px;',
    padding: '0 0 10px;',
    layout: 'fit',
    ui: 'fgi_panel_gray_transparent',
    autoScroll: true,

    initComponent: function(){

	    this.dockedItems = [{
	            xtype: 'container',
	            ui: 'fgi_panel_gray_transparent',
	            height: 28,
	            cls: 'sectionSubHeader',
	            style: 'padding: 2px 0 0 5px;',
	            html: this.sectionTitle,
	            dock: 'top'
	        }];

	    this.callParent(arguments);
	}
});