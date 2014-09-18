Ext.define('Arches.widgets.ExpandableReportSection',{
	alias: 'widget.arches-widgets-expandablereportsection',
	extend: 'Ext.panel.Panel',
    
    sectionTitle: 'Expandable Report Section',
    height: 160,
    cls: 'expandableTextArea',
    bodyStyle: 'padding: 0 15px;',
    layout: 'fit',
    sectionExpanded: false,
    expandLink: 'Show all',
    minimizeLink: 'Collapse',
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
	        },{
	            xtype: 'container',
	            ui: 'fgi_panel_gray_transparent',
	            style: 'text-align:right; padding: 5px 10px 0 0;',
	            height: 28,
	            tpl:'<tpl if="!sectionExpanded"><a href="#" class="summarySectionExpand">{expandLink}</a></tpl>' +
	                '<tpl if="sectionExpanded"><a href="#" class="summarySectionExpand">{minimizeLink}</a></tpl>',
	            dock: 'bottom'
	    }];

	    this.listeners = {
	        'afterrender': {
	            fn: function(){
	            	if(this.body.down('div')){
		                this.fullHeight = this.body.down('div').getHeight() - this.body.getHeight() + this.getHeight();

		                if(this.body.down('div').getHeight() > this.body.getHeight() + 4){
		                    this.dockedItems.last().update(this);
		                    this.desiredHeight = this.getHeight();
		                    this.getEl().on('click', function (e, t, eOpts) {
		                        if (Ext.get(t).hasCls('summarySectionExpand')) {
		                            this.animate({
		                                to: {
		                                    height: (this.getHeight() == this.desiredHeight) ? this.fullHeight : this.desiredHeight,
		                                }
		                            });
		                            this.sectionExpanded = !this.sectionExpanded;
		                            this.dockedItems.last().update(this);
		                        }
		                    }, this);
		                }else{
		                    this.dockedItems.last().setHeight(0);
		                    this.setHeight(this.getHeight() - 14);
		                }
		            }
	            }
	        }
	    };

	    this.callParent(arguments);
	}
});