
Ext.namespace('FGI', 'FGI.grid');

/**
* @class FGI.grid.DynamicRowExpander
* @extends Ext.util.Observable
* A custom row expander that can fetch data remotely when expanding the grid row.
* @constructor
* @param {Object} config The configuration options
*/

FGI.grid.DynamicRowExpander = function(config){
    Ext.apply(this, config);

    this.addEvents({
        beforeexpand : true,
        expand: true,
        beforecollapse: true,
        collapse: true,
        beforeload: true,
        afterload: true
    });

    FGI.grid.DynamicRowExpander.superclass.constructor.call(this);

    if(this.tpl){
        if(typeof this.tpl == 'string'){
            this.tpl = new Ext.Template(this.tpl);
        }
        this.tpl.compile();
    }

    this.state = {};
    this.bodyContent = {};
};

Ext.extend(FGI.grid.DynamicRowExpander, Ext.util.Observable, {
    header: "",
    width: 20,
    sortable: false,
    fixed: true,
    menuDisabled: true,
    dataIndex: '',
    id: 'expander',
    lazyRender: true,
    enableCaching: true,
    autoLoad: {
        url: '', // the url called will be in the form: autoLoad.url + autload.idField
        idField: ''
    },
    loadingText: 'Loading...',
    loadingTpl: '<div class="x-mask-loading"><div style="height:20px;">{0}</div></div>',


    getRowClass: function(record, rowIndex, p, ds) {
        p.cols = p.cols - 1;
        var content = this.bodyContent[record.id];
        if (!content && !this.lazyRender) {
            content = this.getBodyContent(record, rowIndex);
        }
        if (content) {
            p.body = content;
        }
        return this.state[record.id] ? 'x-grid3-row-expanded' : 'x-grid3-row-collapsed';
    },

    init: function(grid) {
        this.grid = grid;

        var view = grid.getView();
        view.getRowClass = this.getRowClass.createDelegate(this);

        view.enableRowBody = true;

        grid.on('render', function() {
            view.mainBody.on('click', this.onMouseDown, this);
        }, this);
    },

    getBodyContent: function(record, index) {
        if (!this.enableCaching) {
            return this.tpl.apply(record.data);
        }
        var content = this.bodyContent[record.id];
        if (!content) {
            content = this.tpl.apply(record.data);
            this.bodyContent[record.id] = content;
        }
        return content;
    },
    //adding a function in here to handle url params that have more than one field in the param list.
    generateUrlParams: function(params, record) {
        if (typeof params == 'string') {
            return record.data[params];
        }
        else {
            var returnVal = '';
            for (var i = 0; i < params.length; i++) {
                    returnVal += record.data[params[i]] + '/';
            }
            return returnVal;
        }
    },
    // get data from a remote source
    getBodyContentFromUrl: function(record, body, rowIndex) {
        var content = this.bodyContent[record.id];
        if (!this.enableCaching || (this.enableCaching && !content)) {
            if (this.fireEvent('beforeload', this, record, body, rowIndex) !== false) {
                body.innerHTML = String.format(this.loadingTpl, this.loadingText);
                Ext.Ajax.request({
                    //url: this.autoLoad.url + record.data[this.autoLoad.idField], //MEGA.config.Urls.Site + record.data.sit_site_gid,
                    url: this.autoLoad.url + this.generateUrlParams(this.autoLoad.idField, record), //MEGA.config.Urls.Site + record.data.sit_site_gid,
                    scope: this,
                    body: body,
                    record: record,
                    rowIndex: rowIndex,
                    disableCaching: false,
                    success: function(response, options) {
                        this.fireEvent('afterload', response, options, this, record, body, rowIndex);
                    },
                    failure: function() {
                    }
                });
            } else {
                return false;
            }
        }
    },

    // set the content of the body and cache if neccesary
    setBodyContent: function(content, body, record) {
        body.innerHTML = content;
        if (this.enableCaching) {
            this.bodyContent[record.id] = content;
        }
    },

    onMouseDown: function(e, t) {
        if (t.className == 'x-grid3-row-expander') {
            e.stopEvent();
            var row = e.getTarget('.x-grid3-row');
            this.toggleRow(row);
        }
    },

    renderer: function(v, p, record) {
        p.cellAttr = 'rowspan="2"';
        return '<div class="x-grid3-row-expander">&#160;</div>';
    },

    renderLoadingTemplate: function() {
        return String.format(this.loadingtpl, this.loadingText);
    },

    beforeExpand: function(record, body, rowIndex) {
        if (this.fireEvent('beforeexpand', this, record, body, rowIndex) !== false) {
            if (this.autoLoad.url != '') {
                this.getBodyContentFromUrl(record, body, rowIndex);
            } else if (this.tpl && this.lazyRender) {
                body.innerHTML = this.getBodyContent(record, rowIndex);
            }
            return true;
        } else {
            return false;
        }
    },

    toggleRow: function(row) {
        if (typeof row == 'number') {
            row = this.grid.view.getRow(row);
        }
        this[Ext.fly(row).hasClass('x-grid3-row-collapsed') ? 'expandRow' : 'collapseRow'](row);
    },

    expandRow: function(row) {
        if (typeof row == 'number') {
            row = this.grid.view.getRow(row);
        }
        var record = this.grid.store.getAt(row.rowIndex);
        var body = Ext.DomQuery.selectNode('tr:nth(2) div.x-grid3-row-body', row);
        if (this.beforeExpand(record, body, row.rowIndex)) {
            this.state[record.id] = true;
            Ext.fly(row).replaceClass('x-grid3-row-collapsed', 'x-grid3-row-expanded');
            this.fireEvent('expand', this, record, body, row.rowIndex);
        }
    },

    collapseRow: function(row) {
        if (typeof row == 'number') {
            row = this.grid.view.getRow(row);
        }
        var record = this.grid.store.getAt(row.rowIndex);
        var body = Ext.fly(row).child('tr:nth(1) div.x-grid3-row-body', true);
        if (this.fireEvent('beforecollapse', this, record, body, row.rowIndex) !== false) {
            this.state[record.id] = false;
            Ext.fly(row).replaceClass('x-grid3-row-expanded', 'x-grid3-row-collapsed');
            this.fireEvent('collapse', this, record, body, row.rowIndex);
        }
    }
});
