Ext.define('FGI.data.GeocoderProxy', {
    extend: 'Ext.data.proxy.Ajax',
    map: null,
    useMapExtent: false,
    searchExtent: null,
    filterResultsOutsideSearchExtent: false,

    constructor: function (config) {
        this.map = config.map;
        this.useMapExtent = config.useMapExtent;
        this.searchExtent = config.searchExtent;
        this.filterResultsOutsideSearchExtent = config.filterResultsOutsideSearchExtent;

        this.geocoder = new google.maps.Geocoder();

        this.callParent(arguments);
    },
    doRequest: function (operation, callback, scope, arg) {
        var olBounds = null;
        var gmapsBounds = null;
        if (this.useMapExtent && this.map !== null) {
            olBounds = this.map.getExtent().transform(this.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
        } else if (this.searchExtent !== null) {
            olBounds = this.searchExtent;
        }
        if (olBounds !== null) {
            gmapsBounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(olBounds.bottom, olBounds.left),
                new google.maps.LatLng(olBounds.top, olBounds.right)
            );
            operation.params.bounds = gmapsBounds;
        }
        this.geocoder.geocode(operation.params, Ext.bind(this.doResponse, this, [operation, this.reader, callback, scope, arg], true));
    },
    doResponse: function (results, status, operation, reader, callback, scope, arg) {
        var success = (status == google.maps.GeocoderStatus.OK || status == google.maps.GeocoderStatus.ZERO_RESULTS);
        var data, lonLat;

        if (success) {
            for (var i = 0; i < results.length; i++) {
                results[i].id = i;
            }

            if (this.filterResultsOutsideSearchExtent && this.searchExtent !== null) {
                data = [];
                for (var i = 0; i < results.length; i++) {
                    lonLat = new OpenLayers.LonLat(results[i].geometry.location.lng(), results[i].geometry.location.lat());

                    if (this.searchExtent.containsLonLat(lonLat)) {
                        data.push(results[i]);
                    }
                }
            } else {
                data = results;
            }

            operation.resultSet = reader.readRecords({
                success: success,
                results: data
            });
            operation.success = true;
            operation.complete = true;
        }

        callback.call(scope, operation, arg, true);
    }
});