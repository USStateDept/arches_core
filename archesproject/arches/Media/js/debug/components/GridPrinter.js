
Ext.define("Ext.ux.grid.Printer", {
    
    requires: 'Ext.XTemplate',

    statics: {
        /**
         * Prints the passed grid. Reflects on the grid's column model to build a table, and fills it using the store
         * @param {Ext.grid.Panel} grid The grid to print
         */
        print: function(grid, featureId) {
            var columns = [];

            var data = [];
            grid.store.data.each(function(item, row) {
                var convertedData = {};

                //apply renderers from column model
                for (var key in item.data) {
                    var value = item.data[key];
                    var found = false;

                    Ext.each(columns, function(column, col) {
                        
                        if (column && column.dataIndex == key) {
                            var meta = {item: '', tdAttr: '', style: ''};
                            value = column.renderer ? column.renderer.call(grid, value, meta, item, row, col, grid.store, grid.view) : value;
                            var varName = column.dataIndex;
                            convertedData[varName] = value;
                            found = true;
                            
                        } else if (column && column.xtype === 'rownumberer'){
                            
                            var varName = column.id;
                            convertedData[varName] = (row + 1);
                            found = true;
                            
                        } else if (column && column.xtype === 'templatecolumn'){
                            
                            value = column.tpl ? column.tpl.apply(item.data) : value;
                            
                            var varName = column.id;
                            convertedData[varName] = value;
                            found = true;
                            
                        } 
                    }, this);

                    if (!found) { // model field not used on Grid Column, can be used on RowExpander
                        var varName = key;
                        convertedData[varName] = value;
                    }
                }

                data.push(convertedData);
            });

            var body = this.generateBody(data, grid);

            var title = grid.title || this.defaultGridTitle;
            var html = '<table class="print-report-table">' + body + '</table>'
            //Here because inline styles using CSS, the browser did not show the correct formatting of the data the first time that loaded
            return html;
        },

        generateBody : function (rowData, grid){
            var gridColumns = grid.columns;
            var headers = [];
            var headerKeys = [];
            var content = [];
            for (col in gridColumns) {
                if (!gridColumns[col].header){
                    headers.push(gridColumns[col].text);
                }
                else {
                    headers.push(gridColumns[col].header);
                }
                headerKeys.push(gridColumns[col].dataIndex);
            }
            for (j in rowData){
                var contentRow = [];
                for (k in headerKeys){
                    contentRow.push(rowData[j][headerKeys[k]]);
                }
                content.push(contentRow);
            }
            htmlTable = this.formatTable({'headers':headers, 'rows':content});
        return htmlTable
        },

        formatTable : function(contents) {
            var htmlBody = ''
            htmlBody = '<tr><th>' + contents.headers.join('</th><th>') + '</th></tr>';
            for (i in contents.rows){
                htmlBody += '<tr><td>' + contents.rows[i].join('</td><td>') + '</td></tr>';
            }
            return htmlBody
        },

        mainTitle: ''

    }
});