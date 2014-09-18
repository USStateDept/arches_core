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

Ext.define('Arches.widgets.Popup', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.arches-widgets-popup',

    layout: 'fit',
    border: true,
    floating: true,
    height: 150,
    width: 300,
    baseCls: 'x-plain',
    contentTpl: new Ext.XTemplate('Popup Content...'),
    map: null,
    feature: null,
    lonLat: null,
    panIn: true,
    hideOnMapMove: true,
    offset: {
        x: 0,
        y: -3
    },  

    initComponent: function () {
        this.addEvents({
            click: true,
            featureset: true
        });

        this.contentPanel = Ext.create('Ext.panel.Panel', {
            ui: this.ui,
            layout: 'fit',
            frame: true,
            tpl: this.contentTpl
        });

        this.items = [this.contentPanel];

        this.anchor = Ext.create('Ext.container.Container', {
            cls: 'popup-anchor',
            dock: 'bottom',
            height: 16
        });

        this.dockedItems = [this.anchor];

        this.callParent(arguments);

        this.on({
            show: function() {
                this.addAnchorEvents();
                this.addClickHandler();
            },
            scope: this,
            single: true
        });
    },

    setFeature: function (feature, lonLat) {
        this.feature = feature;
        this.lonLat = lonLat;

        this.contentPanel.update(feature.attributes);

        this.show();

        this.fireEvent('featureset', feature);
    },

    show: function() {
        this.callParent(arguments);
        this.position();
        if(this.panIn && !this._mapMove) {
            this.panIntoView();
        } else if (this.hideOnMapMove) {
            this.addHideOnMapMoveListener();
        }
    },

    position: function () {
        // have to use getCentoid() call because the bounds for the first feature in array aren't calculated correctly 
        var centerLonLat = this.lonLat;
        if (!centerLonLat) {
            centerLonLat = this.feature.geometry.getCentroid().getBounds().getCenterLonLat();
        }
        var centerPx = this.map.getViewPortPxFromLonLat(centerLonLat);
        var mapBox = Ext.fly(this.map.div).getBox();

        //This works for positioning with the anchor on the bottom.
        var dx = this.getWidth() / 2;
        var dy = this.getHeight();

        //Assuming for now that the map viewport takes up
        //the entire area of the MapPanel
        this.setPosition(centerPx.x + mapBox.x - dx + this.offset.x, centerPx.y + mapBox.y - dy + this.offset.y);
    },
    
    /** private: method[panIntoView]
     *  Pans the MapPanel's map so that an anchored popup can come entirely
     *  into view, with padding specified as per normal OpenLayers.Map popup
     *  padding.
     */
    panIntoView: function() {
        var centerLonLat = this.lonLat;
        if (!centerLonLat) {
            centerLonLat = this.feature.geometry.getCentroid().getBounds().getCenterLonLat();
        }
        var centerPx = this.map.getViewPortPxFromLonLat(centerLonLat);
        var mapBox = Ext.fly(this.map.div).getBox();

        //assumed viewport takes up whole body element of map panel
        var popupPos =  this.getPosition(true);
        popupPos[0] -= mapBox.x;
        popupPos[1] -= mapBox.y;
       
        var panelSize = [mapBox.width, mapBox.height]; // [X,Y]

        var popupSize = this.getSize();

        var newPos = [popupPos[0], popupPos[1]];

        //For now, using native OpenLayers popup padding.  This may not be ideal.
        var padding = this.map.paddingForPopups;

        // X
        if(popupPos[0] < padding.left) {
            newPos[0] = padding.left;
        } else if(popupPos[0] + popupSize.width > panelSize[0] - padding.right) {
            newPos[0] = panelSize[0] - padding.right - popupSize.width;
        }

        // Y
        if(popupPos[1] < padding.top) {
            newPos[1] = padding.top;
        } else if(popupPos[1] + popupSize.height > panelSize[1] - padding.bottom) {
            newPos[1] = panelSize[1] - padding.bottom - popupSize.height;
        }

        var dx = popupPos[0] - newPos[0];
        var dy = popupPos[1] - newPos[1];

        this.map.pan(dx, dy);

        if ((dx !== 0 || dy!== 0) && this.hideOnMapMove) {
            var addListener = function () {
                this.addHideOnMapMoveListener();
                this.map.events.un({
                    "moveend" : addListener,
                    scope : this
                });
            }
            this.map.events.on({
                "moveend" : addListener,
                scope : this            
            });
        } else if (this.hideOnMapMove) {
            this.addHideOnMapMoveListener();
        }
    },

    addHideOnMapMoveListener: function() {
        var hideMe = function () {
            this.hide();
            this.map.events.un({
                "move" : hideMe,
                scope : this
            });
        }
        this.map.events.on({
            "move" : hideMe,
            scope : this            
        });
    },
    
    /** private: method[onMapMove]
     */
    onMapMove: function() {
        this._mapMove = true;
        if (this.isVisible()) {
            this.position();
        }
        delete this._mapMove;
    },
    
    /** private: method[addAnchorEvents]
     */
    addAnchorEvents: function() {
        this.map.events.on({
            "move" : this.onMapMove,
            scope : this            
        });
        
        this.on({
            "resize": this.position,
            "collapse": this.position,
            "expand": this.position,
            scope: this
        });
    },
    
    /** private: method[removeAnchorEvents]
     */
    removeAnchorEvents: function() {
        //stop position with feature
        this.map.events.un({
            "move" : this.onMapMove,
            scope : this
        });

        this.un("resize", this.position, this);
        this.un("collapse", this.position, this);
        this.un("expand", this.position, this);

    },

    addClickHandler: function() {
        this.getEl().on('click', function(e, el){
            this.fireEvent('click', this, e, Ext.get(e.getTarget()))
            e.stopPropagation();
        }, this)
    }
});