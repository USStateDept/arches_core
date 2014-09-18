Ext.define('FGI.widgets.Geocoder', {
    extend: 'Ext.form.ComboBox',
    alias: 'fgi-widgets-geocoder',
    queryMode: 'remote',
    valueField: 'address',
    queryParam: 'address',
    typeAhead: false,
    listConfig: {
        loadingText: 'Searching...',
        emptyText: 'No matching locations found.',

        // Custom rendering template for each item
        getInnerTpl: function () {
            return '<div class="search-item">' +
                        '{address}' +
                    '</div>';
        }
    },

    map: null,
    useMapExtent: false,
    searchExtent: null,
    filterResultsOutsideSearchExtent: false,

    initComponent: function () {
        this.store = Ext.create('FGI.data.GeocoderStore', {
            map: this.map,
            useMapExtent: this.useMapExtent,
            searchExtent: this.searchExtent,
            filterResultsOutsideSearchExtent: this.filterResultsOutsideSearchExtent
        });

        this.callParent(arguments);
    },

    zoomToResultExtent: function (record) {
        var ne = record.data.geometry.viewport.getNorthEast();
        var sw = record.data.geometry.viewport.getSouthWest();
        var bounds = new OpenLayers.Bounds(sw.lng(), sw.lat(), ne.lng(), ne.lat());
        bounds = bounds.transform(new OpenLayers.Projection("EPSG:4326"), this.map.getProjectionObject());

        this.map.zoomToExtent(bounds);
    }
});