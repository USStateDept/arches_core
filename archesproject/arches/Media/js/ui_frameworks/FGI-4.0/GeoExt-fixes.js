Ext.namespace("GeoExt");


Ext.override(GeoExt.Popup, {
    offMap: false,
    position: function() {
        if (this.feature != null) {
            var centerLonLat = this.feature.geometry.getBounds().getCenterLonLat();

            if (this._mapMove === true) {
                var visible = this.map.getExtent().containsLonLat(centerLonLat);
                if (visible !== this.isVisible()) {
                    //Prevent popup from opening when feature in the map extent, hidden, and the map has been panned
                    if (visible == false) {
                        this.offMap = true;
                        this.setVisible(visible);
                    }
                    //If the popup was previously closed when panned out of map extent then reopen it
                    if (visible && this.offMap) {
                        this.offMap = false;
                        this.setVisible(visible);
                    }
                }
            }

            if (this.isVisible()) {
                var centerPx = this.map.getViewPortPxFromLonLat(centerLonLat);
                var mapBox = Ext.fly(this.map.div).getBox();

                //This works for positioning with the anchor on the bottom.

                var anc = this.anc;
                var dx = anc.getLeft(true) + anc.getWidth() / 2;
                var dy = this.el.getHeight();

                //Assuming for now that the map viewport takes up
                //the entire area of the MapPanel
                this.setPosition(centerPx.x + mapBox.x - dx, centerPx.y + mapBox.y - dy);
            }
        }
    },
    unanchorPopup: function() {
        this.removeAnchorEvents();

        //make the window draggable
        this.draggable = true;
        this.header.addClass("x-window-draggable");
        this.dd = new Ext.Window.DD(this);

        //remove anchor
        this.anc.remove();
        this.anc = null;

        //hide unpin tool
        if (this.tools.unpin) {
            this.tools.unpin.hide();
        }
    }
});
