
//Issue with scrollbar disappearing if grid is reloaded with data that doesn't require a scrollbar and the again with data that does
//http://webcache.googleusercontent.com/search?q=cache:8uJ_izLumlwJ:www.sencha.com/forum/showthread.php%3F133422-Infinite-Grid-scrollbar-disappears%26daysprune%3D-1+infinite+grid+scrollbar+disappears&cd=1&hl=en&ct=clnk&gl=us&client=ubuntu&source=www.google.com
Ext.override(Ext.panel.Table,
{
    /**
    * Request a recalculation of scrollbars and put them in if they are needed.
    */
    determineScrollbars: function () {
        var me = this,
            viewElDom,
            centerScrollWidth,
            centerClientWidth,
            scrollHeight,
            clientHeight;

        if (!me.collapsed && me.view && me.view.el && me.view.el.dom) {
            viewElDom = me.view.el.dom;
            //centerScrollWidth = viewElDom.scrollWidth;
            centerScrollWidth = me.headerCt.getFullWidth();
            /**
            * clientWidth often returns 0 in IE resulting in an
            * infinity result, here we use offsetWidth bc there are
            * no possible scrollbars and we don't care about margins
            */
            centerClientWidth = viewElDom.offsetWidth;
            if (me.verticalScroller && me.verticalScroller.el) {
                //if the scroller was removed because of hide, we need to assign it back here
                if (!me.verticalScroller.ownerCt) {
                    me.verticalScroller.ownerCt = this;
                }
                scrollHeight = me.verticalScroller.getSizeCalculation().height;
            } else {
                scrollHeight = viewElDom.scrollHeight;
            }

            clientHeight = viewElDom.clientHeight;

            if (!me.collapsed && scrollHeight > clientHeight) {
                me.showVerticalScroller();
            } else {
                me.hideVerticalScroller();
            }

            if (!me.collapsed && centerScrollWidth > (centerClientWidth + Ext.getScrollBarWidth() - 2)) {
                me.showHorizontalScroller();
            } else {
                me.hideHorizontalScroller();
            }
        }
    },


    /**
    * Show the horizontalScroller and add the horizontalScrollerPresentCls.
    */
    showHorizontalScroller: function () {
        var me = this;

        if (me.verticalScroller) {
            me.verticalScroller.offsets.bottom = Ext.getScrollBarWidth() - 2;
        }

        //check if it is docked or not because the item may have been removed on hide
        if (me.horizontalScroller && !me.getDockedComponent(me.horizontalScroller)) {
            me.addDocked(me.horizontalScroller);
            me.addCls(me.horizontalScrollerPresentCls);
            me.fireEvent('scrollershow', me.horizontalScroller, 'horizontal');
        }
    },


    /**
    * Show the verticalScroller and add the verticalScrollerPresentCls.
    */
    showVerticalScroller: function () {
        var me = this,
            headerCt = me.headerCt;

        // only trigger a layout when reserveOffset is changing
        if (headerCt && !headerCt.layout.reserveOffset) {
            headerCt.layout.reserveOffset = true;
            headerCt.doLayout();
        }

        //check if it is docked or not because the item may have been removed on hide
        if (me.verticalScroller && !me.getDockedComponent(me.verticalScroller)) {
            me.addDocked(me.verticalScroller);
            me.addCls(me.verticalScrollerPresentCls);
            me.fireEvent('scrollershow', me.verticalScroller, 'vertical');
        }
    }
});


//Stop error with GuarenteedRange function for infinite scrolling grid
//http://www.sencha.com/forum/archive/index.php/t-133912.html?s=b70dfdbd124816f78e29202cc1aa832a
Ext.Error.handle = function (err) {
    if (err.sourceMethod === "onGuaranteedRange") {
        return true;
    }
};

