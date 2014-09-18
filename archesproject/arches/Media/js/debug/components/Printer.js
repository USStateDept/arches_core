Ext.define("Ext.ux.Printer", {
    statics: {
        print: function(htmlElements, printAutomatically) {
            var win = window.open('', 'Print Panel');
            var html = htmlElements.join("<br>");
            win.document.open();
            win.document.write(html);
            win.document.close();

            if (printAutomatically){
                win.print();
            }

            if (this.closeAutomaticallyAfterPrint){
                if(Ext.isIE){
                    window.close();
                } else {
                    win.close();
                }
            }
    }

    }
});