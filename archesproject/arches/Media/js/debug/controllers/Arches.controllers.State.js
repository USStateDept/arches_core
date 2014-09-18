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

Ext.define('Arches.controller.State', {
    extend: 'Ext.util.Observable',
    alias: 'controller.arches-controller-state',
    state: {
        user: 'anonymous',
        view: 'splash'
    },

    app: null,

    constructor: function (config) {
        this.addEvents({
            "beforeviewstatechange": true,
            "afterviewstatechange": true,
            "beforeuserstatechange": true,
            "afteruserstatechange": true
        });

        // Call our superclass constructor to complete construction process.
        this.callParent(arguments);

        Ext.History.on('change', function (token, opts) {
            switch (token) {
                case 'map':
                    this.setState('view', 'map');
                    break;
                case 'splash':
                    this.setState('view', 'splash');
                    break;
            }
        }, this);

        this.setState(this.state);
    },

    setState: function (type, state) {
        if (typeof type === 'object') {
            Ext.Object.each(type, function (key, value, self) {
                this.setState(key, value);
            }, this);
        } else {
            if (this.fireEvent('beforestatechange', this, type, state)) {
                switch (type) {
                    case 'user':
                        this.setUserState(state);
                        break;
                    case 'view':
                        this.setViewState(state);
                        break;
                }
                this.fireEvent('afterstatechange', this, type, state);
                this.state[type] = state;
            }
        }
    },

    setUserState: function (state) {
        switch (state) {
            case 'anonymous':
                this.app.data.user = 'undefined';
                this.setState('view', 'splash');
                break;
            case 'loggedin':
                Ext.getCmp('welcome-text').update({ username: this.app.data.user.fields.first_name });
                if (this.state.view === 'splash') {
                    this.setState('view', 'map');
                }
                break;
        }
    },

    setViewState: function (state) {
        var token = Ext.History.getToken();
        switch (state) {
            case 'splash':
                this.app.viewport.layout.setActiveItem(this.app.splashPanel);
                Ext.getCmp('loginbtn').toggle(false);
                break;
            case 'map':
                this.app.viewport.layout.setActiveItem(this.app.appPanel);
                break;
        }

        if (token !== state) {
            Ext.History.add(state);
        }
    }

});