Ext.define('FGI.data.GeocoderStore', {
    extend: 'Ext.data.Store',
    map: null,
    useMapExtent: false,
    searchExtent: null,
    filterResultsOutsideSearchExtent: false,

    constructor: function (config) {
        this.map = config.map;
        this.useMapExtent = config.useMapExtent;
        this.searchExtent = config.searchExtent;
        this.filterResultsOutsideSearchExtent = config.filterResultsOutsideSearchExtent;

        Ext.define('FGI.data.GeocoderModel', {
            extend: 'Ext.data.Model',
            proxy: new FGI.data.GeocoderProxy({
                map: this.map,
                useMapExtent: this.useMapExtent,
                searchExtent: this.searchExtent,
                filterResultsOutsideSearchExtent: this.filterResultsOutsideSearchExtent,
                reader: {
                    type: 'array',
                    root: 'results'
                }
            }),
            fields: [
                { name: 'id', mapping: 'id' },
                { name: 'address', mapping: 'formatted_address' },
                { name: 'components', mapping: 'address_components' },
                { name: 'types', mapping: 'types' },
                { name: 'geometry', mapping: 'geometry' }
            ]
        });

        this.model = 'FGI.data.GeocoderModel';

        this.callParent(arguments);
    }
});