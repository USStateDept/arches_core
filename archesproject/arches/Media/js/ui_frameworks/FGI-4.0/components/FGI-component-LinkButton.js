/// <reference path="../../Ext-4.0.1/ext-all-debug.js" />

/**
* @class FGI.component.LinkButton
* @extends Ext.button.Button
* @requires Ext 4.0.0
* Simple Link Button class that extends the Ext.button.Button class.  Allows you to create a link with similar funcitonality
*   as an Ext.button.Button (using an Ext.Action for example)
* @cfg {String} text The link text
* @cfg {String} icon The path to an image to display in the link (the image will be set as the background-image
*   CSS property of the button by default, so if you want a mixed icon/text button, set cls:"x-btn-text-icon")
* @cfg {Function} handler A function called when the link is clicked (can be used instead of click event)
* @cfg {Object} scope The scope of the handler
* @cfg {Number} minWidth The minimum width for this link (used to give a set of links a common width)
* @cfg {String/Object} tooltip The tooltip for the link - can be a string or QuickTips config object
* @cfg {Boolean} hidden True to start hidden (defaults to false)
* @cfg {Boolean} disabled True to start disabled (defaults to false)
* @cfg {Boolean} pressed True to start pressed (only if enableToggle = true)
* @cfg {String} toggleGroup The group this toggle button is a member of (only 1 per group can be pressed, only
* applies if enableToggle = true)
* @cfg {Boolean/Object} repeat True to repeat fire the click event while the mouse is down. This can also be
*   an {@link Ext.util.ClickRepeater} config object (defaults to false).
* @constructor
* Create a new link button
* @param {Object} config The config object
*/
Ext.define('FGI.component.LinkButton', {
    extend: 'Ext.button.Button',
    alias: 'fgi-widgets-linkbutton',

    // anchor tag based template
    template: new Ext.Template('<a class="x-btn x-link-btn-text">{0}</a>'),

    // private
    onRender: function(ct, position) {
        var btn, templateArgs = [this.text || '&#160;'];

        if (position) {
            btn = this.template.insertBefore(position, templateArgs, true);
        } else {
            btn = this.template.append(ct, templateArgs, true);
        }

        this.initButtonEl(btn);

        if (this.menu) {
            this.el.child(this.menuClassTarget).addClass("x-btn-with-menu");
        }
        Ext.ButtonToggleManager.register(this);
    },

    // private
    initButtonEl: function(btn) {

        this.el = btn;

        if (this.icon) {
            btn.setStyle('background-image', 'url(' + this.icon + ')');
        }
        if (this.iconCls) {
            btn.addClass(this.iconCls);
            if (!this.cls) {
                btn.addClass(this.text ? 'x-link-btn-text-icon' : 'x-link-btn-icon');
            }
        }
        if (this.tabIndex !== undefined) {
            btn.dom.tabIndex = this.tabIndex;
        }
        if (this.tooltip) {
            if (typeof this.tooltip == 'object') {
                Ext.QuickTips.register(Ext.apply({
                    target: btn.id
                }, this.tooltip));
            } else {
                btn.dom[this.tooltipType] = this.tooltip;
            }
        }

        if (this.pressed) {
            this.el.addClass("x-btn-pressed");
        }

        if (this.handleMouseEvents) {
            btn.on("mouseover", this.onMouseOver, this);
            // new functionality for monitoring on the document level
            //btn.on("mouseout", this.onMouseOut, this);
            btn.on("mousedown", this.onMouseDown, this);
        }

        if (this.menu) {
            this.menu.on("show", this.onMenuShow, this);
            this.menu.on("hide", this.onMenuHide, this);
        }

        if (this.id) {
            this.el.dom.id = this.el.id = this.id;
        }

        if (this.repeat) {
            var repeater = new Ext.util.ClickRepeater(btn,
                typeof this.repeat == "object" ? this.repeat : {}
            );
            repeater.on("click", this.onClick, this);
        }

        btn.on(this.clickEvent, this.onClick, this);
    }
});