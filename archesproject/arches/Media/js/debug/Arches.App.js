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

Ext.define('Arches.app', {
    extend: 'Ext.util.Observable',

    i18n: {
        appInitMask: 'Initializing...',
        loginMask: 'Signing In...',
        underConstructionHeader: 'Under Construction...',
        underConstructionMessage: 'This feature is coming soon!'
    },

    data: { user: null },

    constructor: function () {
        this.addEvents({
            'loaded': true
        });

        Ext.tip.QuickTipManager.init();
        Ext.History.init();

        this.loadingMask = Ext.Msg.wait(this.i18n.appInitMask);

        Ext.apply(this.i18n, Arches.i18n.App);

        Ext.apply(Arches.config.Tpls, {
            appData: this.data
        });

        this.buildUI();
        this.applyListeners();
        this.loadData();

        if (window.location.hash === '#map') {
            this.viewport.getLayout().setActiveItem(this.appPanel);
        }

        this.callParent(arguments);

        this.fireEvent('loaded');
    },

    /*
    * setup all visual components
    */
    buildUI: function () {
        this.appPanel = Ext.create('Arches.widgets.AppPanel');

        this.viewport = new Ext.Viewport({
            layout: 'card',
            style: 'background: #373c3f;',
            items: [
                this.appPanel
            ]
        });
    },


    /*
    * setup all the listeners
    */
    applyListeners: function () {
        this.appPanel.on({
            'userchanged': this.setUser,
            'activate': function () {
                window.location.hash = 'map';
            },
            'deactivate': function () {
                this.appPanel.mapPanel.hideAllPopups();
                this.appPanel.appHeader.loginWindow.hide();
            },
            scope: this
        });

        this.viewport.on({
            'afterlayout': function () {
                this.appPanel.reportsPanel.updateSize();
            },
            scope: this
        });

        this.on({
            'loaded': function () {
                this.loadingMask.hide();
                this.getUser();
            },
            scope: this
        });
    },

    /*
    * load the data into the app
    */
    loadData: function () {

    },

    // calls the app.login function if the user is logged in on the server
    getUser: function() {
        Ext.Ajax.request({
            url: Arches.config.Urls.getUser,
            scope: this,
            disableCaching: false,
            success: function(response, options) {
                var ret = Ext.decode(response.responseText);
                if (ret.success) {
                    var user = ret.returnObj[0].fields;
                    this.setUser(user);
                }
            }
        });
    },

    setUser: function (user) {
        if (user.hasOwnProperty("is_staff") && user.is_staff){
            this.data.user = user;
            this.appPanel.setUser(user);    
        }
    }
});

Ext.override(Ext.grid.RowEditor, {
    loadRecord: function(record) {
        var me = this,
            form = me.getForm();
        form.loadRecord(record);
        if (form.isValid()) {
            me.hideToolTip();
        } else if (me.errorSummary) {
            me.showToolTip();
        }

        // render display fields so they honor the column renderer/template
        Ext.Array.forEach(me.query('>displayfield'), function (field) {
            me.renderColumnData(field, record);
        }, me);
    }
});

// override for issue with grid scrolling in current version of ExtJS:
// http://www.sencha.com/forum/showthread.php?183703-Scrollbar-Issue-with-extjs-4-grid
Ext.override(Ext.grid.Panel, {
    initComponent: function() {
        this.callOverridden();

        this.on('scrollershow', function(scroller) {
          if (scroller && scroller.scrollEl) {
            scroller.clearManagedListeners();
            scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller);
          }
        });
    },

    onViewRefresh: function() {
        try {
            this.callParent();
        }
        catch (e) {}
    }
});



Ext.onReady(function () {
    arches = Ext.create('Arches.app');
});