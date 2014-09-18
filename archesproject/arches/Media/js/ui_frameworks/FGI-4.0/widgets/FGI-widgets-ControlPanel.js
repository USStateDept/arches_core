Ext.define('FGI.widgets.ControlPanel', {
    extend: 'Ext.window.Window',
    alias: 'fgi-widgets-controlpanel',

    sizeManager: {
        large: {
            width: 107,
            height: 82
        },
        small: {
            width: 45,
            height: 26
        },
        current: 'small'
    },

    title: 'Tasks',
    layout: 'hbox',
    layoutConfig: {
        padding: '0',
        align: 'middle'
    },
    headerCfg: {
        height: 100
    },
    minWidth: 5,
    minHeight: 5,
    closable: false,
    draggable: false,
    resizable: false,

    config: {
        parent: null  
    },

    initComponent: function () {
        this.width = this.sizeManager[this.sizeManager.current].width;
        this.height = this.sizeManager[this.sizeManager.current].height;

        this.on({
            'render': function (w) {
                w.getEl().on('mouseover', function (e) {
                    this.stopAnimation();
                    this.sizeManager.current = 'large';
                    this.autoPositionAndResize(true, 0);
                }, this);
                w.getEl().on('mouseout', function (e) {
                    if (!e.within(w.getEl(), true)) {
                        this.sizeManager.current = 'small';
                        this.autoPositionAndResize(true, 1000);
                    }
                }, this);
            },
            scope: this
        });

        this.callParent(arguments);
    },

    autoPositionAndResize: function (animate, delay) {
        var parentPos = this.parent.getPosition();
        var parentSize = this.parent.getSize();

        var x = parentPos[0] + parentSize.width - this.sizeManager[this.sizeManager.current].width - 10;
        var y = parentPos[1] + 70;

        if (animate) {
            this.animate({
                to: {
                    x: x,
                    y: y,
                    width: this.sizeManager[this.sizeManager.current].width,
                    height: this.sizeManager[this.sizeManager.current].height
                },
                delay: delay
            });
        } else {
            this.setSize(this.sizeManager[this.sizeManager.current].width, this.sizeManager[this.sizeManager.current].height);
            this.setPosition(x, y);
        }
    }
});