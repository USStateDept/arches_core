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

Ext.define('Arches.widgets.AppHeader', {
    extend: 'Ext.container.Container',
    alias: 'widgets.arches-widgets-appheader',

    i18n: {
        title: 'Heritage Map',
        administrationLink: 'Administration',
        tutorialsLink: 'Tutorials',
        subtitle: 'National Heritage and Documentation System',
        usernameDisplayPrefix: 'Welcome',
        entitySearchMask: 'Find an Entity'
    },

    id: 'app-header',
    region: 'north',
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    basemapsMenuStore: null,
    height: 86,

    user: null,

    initComponent: function () {
        this.addEvents({
            'emailclicked': true,
            'folderclicked': true,
            'cogclicked': true,
            'feedbackclicked': true,
            'titleclicked': true,
            'reportsclicked': true,
            'adminclicked': true,
            'logoutclicked': true,
            'searchItemClicked': true
        });
        this.search = Ext.create('Arches.widgets.Search', {
            style: 'padding-left:85px'
        });
/*
        this.loginWindow = Ext.create('Ext.form.Panel', {
            style: 'background-color: #FFFFFF;border: 1px solid #808080;padding-bottom: 15px;',
            floating: true,
            x: -10,
            y: -10,
            baseCls: 'x-plain',
            width: 250,
            height: 215,
            bodyPadding: 10,
            layout: 'anchor',
            defaults: {
                anchor: '100%',
                labelWidth: 65,
                allowBlank: false,
                enableKeyEvents: true,
                listeners: {
                    'keydown': function(textField, event, eventOptions) {
                        if (event.getKey() === event.ESC) {
                            this.loginWindow.hide();
                            this.loginWindow.getForm().findField('password').reset();
                        } else if (event.getKey() === event.RETURN && this.loginWindow.getForm().isValid()) {
                            this.signIn();
                        }
                    },
                    scope: this
                }
            },
            defaultType: 'textfield',
            items: [{
                xtype: 'container',
                style: 'margin-left: 206px;background-size: 20px;cursor: pointer;',
                cls: 'glyph-circle',
                height: 20,
                listeners: {
                    'afterrender': function (cmp) {
                        var el = cmp.getEl();
                        el.on({
                            'click': function () {
                                this.loginWindow.hide();
                                this.loginWindow.getForm().findField('password').reset();
                            },
                            scope: this
                        });
                    },
                    scope: this
                }
            },{
                xtype: 'container',
                html: 'Log on to Arches',
                style: 'text-align: center;font-size: 22px;color: #373C3F;padding-top: 5px;',
                height: 46
            },{
                name: 'username',
                emptyText: 'user name',
                height: 32
            },{
                emptyText: 'password',
                name: 'password',
                inputType: 'password',
                height: 32
            }],
            buttons: [{
                text: 'Sign in',
                style: 'margin-right:10px;',
                ui: 'fgi_button_white',
                width: 228,
                scale: 'medium',
                disabled: true,
                formBind: true,
                handler: this.signIn,
                scope: this
            }],
            listeners: {
                // Listener is here to fix a bug w/ formbind in ExtJS: http://stackoverflow.com/questions/6795511/extjs-simple-form-ignores-formbind
                'afterrender': function(me) {
                    delete me.form._boundItems;
                },
                'show': function () {
                    this.userButton.disable();
                    this.loginWindow.getForm().findField('username').focus(true);
                    this.loginWindow.alignTo(this.userButton, 'tr-bl', [-35, 20]);
                },
                'hide': function () {
                    this.userButton.enable();
                },
                scope: this
            }
        });
*/

        this.userInfo = Ext.create('Ext.container.Container', {
            style: 'text-align: right;padding: 6px 20px 0px 0px;color: #A0A0A0;',
            tpl: '<tpl if="user">Welcome, {user.username}</tpl>',
            flex: 1
        });

        this.userButton = Ext.create('Ext.button.Button',{
            ui: 'fgi_button_white',
            scale: 'medium',
            text: ' ',
            height: 32,
            width: 40,
            iconCls: 'glyph-person',
            iconAlign: 'top',
            tooltip: 'Sign out',
            handler: function () {
                    this.signOut();
            },
            scope: this
        });

        this.subHeader = Ext.create('Ext.panel.Panel', {
            layout: 'hbox',
            height: 50,
            baseCls: 'x-plain',
            cls: 'app-subheader',
            items: [
                this.search,
            {
                xtype: 'container',
                layout: {
                    type: 'hbox'
                },
                flex: 1,
                items: [
                    this.userInfo,
                    this.userButton
                ]
            }]
        });

        this.mainHeader = Ext.create('Ext.panel.Panel', {
            layout: {
                type: 'hbox',
                pack: 'end',
                align: 'stretch'
            },
            border: false,
            bodyStyle: 'padding: 2px 0px 2px 68px; background: #373c3f',
            height: 36,
            items: [{
                xtype: 'container',
                layout: 'fit',
                style: 'padding: 6px 10px 0px 30px;',
                html: '<a style="color: white; text-decoration: none;" href="http://archesproject.org/forum/" target="_blank" id="feedback-link">Feedback</a>',
                autoWidth: true,
                listeners: {
                    'afterrender': function () {
                        Ext.get('feedback-link').on('click',
                            function () {
                                this.fireEvent('feedbackclicked');
                            }, this
                        );
                    },
                    scope: this
                }
            },{
                xtype: 'container',
                layout: 'fit',
                style: 'background: #373c3f;color: white; font-size: 10px ;padding:6px 20px; color: #949494;',
                html: 'version:' + Arches.config.App.arches_version
            }]
        });

        this.items = [
            this.mainHeader,
            this.subHeader
        ];

        this.callParent(arguments);

        this.logo = Ext.create('Ext.container.Container', {
            layout: 'fit',
            cls: 'header-logo',
            width: 62,
            height: 64,
            floating: true,
            shadow: false,
            x: 15,
            y: 10
        });
    },

    signIn: function () {
        var mask = new Ext.LoadMask(Ext.getBody(), {msg:"Signing in..."});
        mask.show();

        Ext.Ajax.request({
            url: Arches.config.Urls.login,
            params: {
                username: this.loginWindow.getForm().findField('username').getValue(),
                password: this.loginWindow.getForm().findField('password').getValue()
            },
            success: function(response){
                mask.hide();
                this.loginWindow.getForm().findField('password').reset();
                var ret = Ext.JSON.decode(response.responseText);
                if (ret.success) {
                    var user = ret.returnObj[0].fields;
                    this.loginWindow.hide();
                    this.fireEvent('userchanged', user);
                } else {
                    Ext.Msg.alert('Login Failed', 'Login unsuccessful.  Please try again.  If you think this message is in error contact your system administrator.');
                }

            },
            failure: function () {
                mask.hide();
                this.loginWindow.getForm().findField('password').reset();
                Ext.Msg.alert('Login Failed', 'Login unsuccessful.  Please try again.  If you think this message is in error contact your system administrator.');
            },
            scope: this
        });
    },

    setUser: function (user) {
        if (user) {
            this.userButton.setTooltip('Sign out');
        } else {
            this.userButton.setTooltip('Sign in');
        }
        this.userInfo.update({ user: user });
        this.user = user;
    },

    signOut: function () {
        if(this.fireEvent('beforesignout')) {
            var mask = new Ext.LoadMask(Ext.getBody(), {msg:"Signing out..."});
            mask.show();

            Ext.Ajax.request({
                url: Arches.config.Urls.logout,
                success: function(response){
                    window.location.replace("/Arches/User/Login");
                    mask.hide();
                    this.fireEvent('userchanged', null);
                },
                failure: function () {
                    mask.hide();
                    Ext.Msg.alert('Logout Failed', 'Logout unsuccessful.  Please try again.  If you think this message is in error contact your system administrator.');
                },
                scope: this
            });
        }
    }
});