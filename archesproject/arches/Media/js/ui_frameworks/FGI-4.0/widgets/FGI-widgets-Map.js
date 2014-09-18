Ext.define('FGI.widgets.MapPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'fgi-widgets-mappanel',

    layout: 'fit',

    config: {
        map: null
    },

    initComponent: function () {
        // avoid pink tiles
        OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
        OpenLayers.Tile.Image.useBlankTile = true;
        OpenLayers.Util.onImageLoadError = function () {
            /**
            * For images that don't exist in the cache, you can display
            * a default image - one that looks like water for example.
            * To show nothing at all, leave the following lines commented out.
            */
            //this.src = OpenLayers.Util.getImagesLocation() + "blank.gif";
            //this.style.display = "";
        };

        this.map.mapContainer = this;

        this.contentEl = this.map.div;

        // Set the map container height and width to avoid css 
        // bug in standard mode. 
        // See https://trac.mapfish.org/trac/mapfish/ticket/85
        var content = Ext.get(this.contentEl);
        content.setStyle('width', '100%');
        content.setStyle('height', '100%');

        this.on({
            'bodyresize': function () {
                this.map.updateSize();
            },
            'afterlayout': function () {
                this.map.updateSize();
            }
        });

        this.callParent(arguments);
    },

    onRender: function () {
        // hack to get google tile images to fill all the way to the bottom of the map
        this.map.events.register('changebaselayer', this, function () {
            this.map.updateSize();
        });

        this.map.updateSize();

        // Call parent (required)
        this.callParent(arguments);
    }
});