Ext.define('Arches.formcomponents.Buttons',{
    extend: 'Ext.button.Button',
    text: '-----',
    scale: 'medium',
    height: 32,
    width: 160,
    style: 'margin-left: 5px;font-size:14px;',
    ui: 'fgi_button_white',

    initComponent: function(){
        this.setText(this.text);
    }
});