/** 
* @class FGI.widgets.LoginForm
* @extends Ext.form.Panel
* @requires Ext 4.0.0
* <p>A simple login form</p>
*/
Ext.define('FGI.widgets.LoginForm', {
    extend: 'Ext.form.Panel',
    alias: 'widget.fgiloginForm',

    // Constructor Defaults, can be overridden by user's config object
    fieldDefaults: {
        labelAlign: 'top',
        msgTarget: 'qtip'
    },
    defaults: {
        xtype: 'textfield',
        anchor: '100%'
    },
    bodyStyle: 'padding:5px 5px 0',
    // Custom configuration properties
    url: '',
    usernameLabel: 'User Name',
    passwordLabel: 'Password',
    usernameParam: 'name',
    passwordParam: 'password',

    loginButtonConfig: {
        text: 'Login'
    },

    initComponent: function () {

        // Events for clicking on the "forgot password" link and a successful login
        this.addEvents({
            'logincomplete': true,
            'loginstart': true
        });

        var loginButton = Ext.apply({
            itemId: 'submitActionBtn',
            formBind: true,
            disabled: true,
            scope: this,
            handler: function () {
                if (this.fireEvent('loginstart')) {
                    this.form.submit({
                        url: this.url,
                        method: 'POST',
                        scope: this,
                        success: function (form, responseObj) {
                            this.fireEvent('logincomplete', form, responseObj, true);
                        },
                        failure: function (form, responseObj) {
                            this.fireEvent('logincomplete', form, responseObj, false);
                        }
                    });
                }
            },
            listeners: {
                enable: {
                    fn: function (btn, opts) {
                        var map = new Ext.util.KeyMap(this.getEl(), {
                            key: Ext.EventObject.ENTER,
                            fn: btn.handler,
                            scope: this
                        });
                    }
                },
                scope: this
            }
        }, this.loginButtonConfig);

        Ext.apply(this, {
            buttons: [
		        loginButton
			]
        });

        this.callParent(arguments);

        this.add([{
            xtype: 'textfield',
            fieldLabel: this.usernameLabel,
            name: this.usernameParam,
            allowBlank: false
        }, {
            xtype: 'textfield',
            fieldLabel: this.passwordLabel,
            name: this.passwordParam,
            allowBlank: false,
            inputType: 'password'
        }]);

        this.on({
            'afterlayout': {
                fn: function () {
                    this.getForm().findField(this.usernameParam).focus();
                },
                delay: 500
            },
            'logincomplete': function (form, responseObj, success) {
                form.findField(this.passwordParam).setValue('');
            },
            scope: this
        });
    }
});
