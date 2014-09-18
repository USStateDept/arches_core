/** 
* @class Colliers.stores.Rest
* @extends Ext.form.Panel
* @requires Ext 4.0.0
* <p>A store conficgured with a Rest Proxy by defualt</p>
*/
Ext.define('FGI.proxy.Rest', {
    extend: 'Ext.data.proxy.Rest',
    alias: 'proxy.fgi-proxy-rest',

    /**
    * Specialized version of buildUrl that incorporates the {@link #appendId} and {@link #format} options into the
    * generated url. Override this to provide further customizations, but remember to call the superclass buildUrl
    * so that additional parameters like the cache buster string are appended
    */
    buildUrl: function (request) {
        var me = this,
            operation = request.operation,
            records = operation.records || [],
            record = records[0],
            format = me.format,
            url = me.getUrl(request),
            id = record ? operation.id : operation.id, // a HACK
            model = operation.scope.model,
            modelType = model.split('.')[model.split('.').length - 1];

        if (!url.match(/\/$/)) {
            url += '/';
        }

        url += id + '/' + modelType;

        if (format) {
            if (!url.match(/\.$/)) {
                url += '.';
            }

            url += format;
        }

        request.url = url;

        // must set this to false so that url doesnt' get corrupted when bulidUrl calls it's parent
        me.appendId = false;

        return me.callParent(arguments);
    }
});
