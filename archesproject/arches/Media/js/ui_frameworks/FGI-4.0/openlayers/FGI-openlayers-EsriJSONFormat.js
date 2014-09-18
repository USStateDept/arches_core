/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
* license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
* full text of the license. */

/**
* @requires OpenLayers/Format/JSON.js
* @requires OpenLayers/Feature/Vector.js
* @requires OpenLayers/Geometry/Point.js
* @requires OpenLayers/Geometry/MultiPoint.js
* @requires OpenLayers/Geometry/LineString.js
* @requires OpenLayers/Geometry/MultiLineString.js
* @requires OpenLayers/Geometry/Polygon.js
* @requires OpenLayers/Geometry/MultiPolygon.js
*/

/**
* Class: OpenLayers.Format.EsriJSONFormat
* Read and write EsriJSON. Create a new parser with the
*     <OpenLayers.Format.EsriJSONFormat> constructor.
*
* Inherits from:
*  - <OpenLayers.Format.JSON>
*/
OpenLayers.Format.EsriJSONFormat = OpenLayers.Class(OpenLayers.Format.JSON, {

    /**
    * recordListLabel
    * {String} identifier used for the list of returned records
    */
    recordListLabel: "results",


    /**
    * wktParser
    * {String} the parser to use to parse the geometry wkt
    */
    wktParser: OpenLayers.Format.WKT,

    /**
    * Constructor: OpenLayers.Format.EsriJSONFormat
    * Create a new parser for EsriJSON.
    *
    * Parameters:
    * options - {Object} An optional object whose properties will be set on
    *     this instance.
    */
    initialize: function(options) {
        OpenLayers.Format.JSON.prototype.initialize.apply(this, [options]);
        this.wktParser = this.wktParser ? new this.wktParser(options) : new OpenLayers.Format.WKT(options);
    },

    /**
    * APIMethod: read
    * Deserialize a EsriJSON string.
    *
    * Parameters:
    * json - {String} A EsriJSON string
    * type - {String} Optional string that determines the structure of
    *     the output.  Supported values are "Geometry", "Feature", and
    *     "FeatureCollection".  If absent or null, a default of
    *     "FeatureCollection" is assumed.
    * filter - {Function} A function which will be called for every key and
    *     value at every level of the final result. Each value will be
    *     replaced by the result of the filter function. This can be used to
    *     reform generic objects into instances of classes, or to transform
    *     date strings into Date objects.
    *
    * Returns: 
    * {Object} The return depends on the value of the type argument. If type
    *     is "FeatureCollection" (the default), the return will be an array
    *     of <OpenLayers.Feature.Vector>. If type is "Geometry", the input json
    *     must represent a single geometry, and the return will be an
    *     <OpenLayers.Geometry>.  If type is "Feature", the input json must
    *     represent a single feature, and the return will be an
    *     <OpenLayers.Feature.Vector>.
    */
    read: function(json, type, filter) {
        type = (type) ? type : "FeatureCollection";
        var results = null;
        var obj = null;
        if (typeof json == "string") {
            //obj = OpenLayers.Format.JSON.prototype.read.apply(this,[json, filter]);
            obj = eval('(' + json + ')');
        } else {
            obj = json;
        }
        if (!obj) {
            OpenLayers.Console.error("Bad JSON: " + json);
        } else {
            results = [];
            for (var i = 0, len = obj[this.recordListLabel].length; i < len; ++i) {
                try {
                    results.push(this.parseFeature(obj[this.recordListLabel][i]));
                } catch (err) {
                    results = null;
                    OpenLayers.Console.error(err);
                }
            }

        }
        return results;
    },


    /**
    * Method: parseFeature
    * Convert a feature object from EsriJSON into an
    *     <OpenLayers.Feature.Vector>.
    *
    * Parameters:
    * obj - {Object} An object created from a EsriJSON object
    *
    * Returns:
    * {<OpenLayers.Feature.Vector>} A feature.
    */
    parseFeature: function(obj) {
        var feature, geometry, attributes;
        attributes = obj;
        try {
            geometry = this.parseGeometry(obj);
        } catch (err) {
            // deal with bad geometries
            throw err;
        }
        feature = new OpenLayers.Feature.Vector(geometry, attributes);
        if (obj.id) {
            feature.fid = obj.id;
        }
        return feature;
    },

    /**
    * Method: parseGeometry
    * Convert a geometry object from EsriJSON into an <OpenLayers.Geometry>.
    *
    * Parameters:
    * obj - {Object} An object created from a EsriJSON object
    *
    * Returns: 
    * {<OpenLayers.Geometry>} A geometry.
    */
    parseGeometry: function(obj) {
        if (obj == null) {
            return null;
        }
        var geometry;

        // Create the geom....
        try {
            geometry = this.parseCoords[obj.geometryType](obj.geometry);
        } catch (err) {
            // deal with bad coordinates
            throw err;
        }

        if (this.internalProjection && this.externalProjection) {
            geometry.transform(this.externalProjection,
                               this.internalProjection);
        }
        return geometry;
    },

    /**
    * Property: parseCoords
    * Object with properties corresponding to the Esri JSON geometry types.
    *     Property values are functions that do the actual parsing.
    */
    parseCoords: {
        'esriGeometryPoint': function(obj) {
            return new OpenLayers.Geometry.Point(obj.x, obj.y);
        },
        'esriGeometryMultipoint': function(obj) {
            var points = []
            for (var i = 0; i < obj.points[i].length; ++i) {
                points.push(new OpenLayers.Geometry.Point(obj.points[i][0], obj.points[i][1]));
            }
            return new OpenLayers.Geometry.MultiPoint(points);
        },
        'esriGeometryPolyline': function(obj) {
            var lines = []
            var points;
            for (var i = 0; i < obj.paths.length; ++i) {
                var points = []
                for (var e = 0; e < obj.paths[i].length; ++e) {
                    points.push(new OpenLayers.Geometry.Point(obj.paths[i][e][0], obj.paths[i][e][1]));
                }
                lines.push(new OpenLayers.Geometry.LineString(points));
            }
            if (lines.length < 2) {
                return lines[0];
            } else {
                return new OpenLayers.Geometry.MultiLineString(lines);
            }
        },
        'esriGeometryPolygon': function(obj) {
            var rings = []
            var points;
            for (var i = 0; i < obj.rings.length; ++i) {
                var points = []
                for (var e = 0; e < obj.rings[i].length; ++e) {
                    points.push(new OpenLayers.Geometry.Point(obj.rings[i][e][0], obj.rings[i][e][1]));
                }
                rings.push(new OpenLayers.Geometry.LinearRing(points));
            }
            return new OpenLayers.Geometry.Polygon(rings);
        }
    },

    /**
    * APIMethod: write
    * Serialize a feature, geometry, array of features into a EsriJSON string.
    *
    * Parameters:
    * obj - {Object} An <OpenLayers.Feature.Vector>, <OpenLayers.Geometry>,
    *     or an array of features.
    * pretty - {Boolean} Structure the output with newlines and indentation.
    *     Default is false.
    *
    * Returns:
    * {String} The EsriJSON string representation of the input geometry,
    *     features, or array of features.
    */
    write: function(obj, pretty) {
        var esrijson = {};
        if (obj instanceof Array) {
            esrijson = [];
            var numFeatures = obj.length;
            for (var i = 0; i < numFeatures; ++i) {
                var element = obj[i];
                if (!element instanceof OpenLayers.Feature.Vector) {
                    var msg = "FeatureCollection only supports collections " +
                              "of features: " + element;
                    throw msg;
                }
                esrijson.push(this.extract.feature.apply(
                    this, [element]
                ));
            }
        } else if (obj.CLASS_NAME.indexOf("OpenLayers.Geometry") == 0) {
            esrijson = this.extract.geometry.apply(this, [obj]);
        } else if (obj instanceof OpenLayers.Feature.Vector) {
            esrijson = this.extract.feature.apply(this, [obj]);
        }
        return OpenLayers.Format.JSON.prototype.write.apply(this,
                                                            [esrijson, pretty]);
    },

    /**
    * Property: extract
    * Object with properties corresponding to the EsriJSON types.
    *     Property values are functions that do the actual value extraction.
    */
    extract: {
        /**
        * Method: extract.feature
        * Return a partial EsriJSON object representing a single feature.
        *
        * Parameters:
        * feature - {<OpenLayers.Feature.Vector>}
        *
        * Returns:
        * {Object} An object representing the point.
        */
        'feature': function(feature) {
            var json = this.extract.geometry.apply(this, [feature.geometry]);
            if (feature.layer && feature.layer.projection) {
                var proj = feature.layer.projection.toString();
                var code = parseInt(proj.substring(proj.indexOf(":") + 1));
                json.geometry.spatialReference = { "wkid": code };
            }
            json.attributes = feature.attributes;
            return json;
        },

        /**
        * Method: extract.geometry
        * Return a EsriJSON object representing a single geometry.
        *
        * Parameters:
        * geometry - {<OpenLayers.Geometry>}
        *
        * Returns:
        * {Object} An object representing the geometry.
        */
        'geometry': function(geometry) {
            if (geometry == null) {
                return null;
            }
            if (this.internalProjection && this.externalProjection) {
                geometry = geometry.clone();
                geometry.transform(this.internalProjection,
                                   this.externalProjection);
            }
            var geometryType = geometry.CLASS_NAME.split('.')[2];
            var esriGeometryType;
            var data = this.extract[geometryType.toLowerCase()].apply(this, [geometry]);
            var json = {};
            switch (geometryType.toLowerCase()) {
                case 'point':
                    json = {
                        "geometryType": 'esriGeometryPoint',
                        "geometry": data
                    };
                    break;
                case 'multipoint':
                    json = {
                        "geometryType": 'esriGeometryMultiPoint',
                        "geometry": { "points": [data] }
                    };
                    break;
                case 'linestring':
                    json = {
                        "geometryType": 'esriGeometryPolyline',
                        "geometry": { "paths": [data] }
                    };
                    break;
                case 'multilinestring':
                    json = {
                        "geometryType": 'esriGeometryPolyline',
                        "geometry": { "paths": data }
                    };
                    break;
                case 'polygon':
                    json = {
                        "geometryType": 'esriGeometryPolygon',
                        "geometry": { "rings": data }
                    };
                    break;
                case 'multipolygon':
                    json = {
                        "geometryType": 'esriGeometryPolygon',
                        "geometry": { "rings": data }
                    };
                    break;
            }

            return json;
        },

        /**
        * Method: extract.point
        * Return an array of coordinates from a point.
        *
        * Parameters:
        * point - {<OpenLayers.Geometry.Point>}
        *
        * Returns: 
        * {Array} An array of coordinates representing the point.
        */
        'point': function(point) {
            return { x: point.x, y: point.y };
        },

        /**
        * Method: extract.point
        * Return an array of coordinates from a point.
        *
        * Parameters:
        * point - {<OpenLayers.Geometry.Point>}
        *
        * Returns: 
        * {Array} An array of coordinates representing the point.
        */
        'pointArr': function(point) {
            return [point.x, point.y];
        },

        /**
        * Method: extract.multipoint
        * Return an array of point coordinates from a multipoint.
        *
        * Parameters:
        * multipoint - {<OpenLayers.Geometry.MultiPoint>}
        *
        * Returns:
        * {Array} An array of point coordinate arrays representing
        *     the multipoint.
        */
        'multipoint': function(multipoint) {
            var array = [];
            for (var i = 0, len = multipoint.components.length; i < len; ++i) {
                array.push(this.extract.pointArr.apply(this, [multipoint.components[i]]));
            }
            return array;
        },

        /**
        * Method: extract.linestring
        * Return an array of coordinate arrays from a linestring.
        *
        * Parameters:
        * linestring - {<OpenLayers.Geometry.LineString>}
        *
        * Returns:
        * {Array} An array of coordinate arrays representing
        *     the linestring.
        */
        'linestring': function(linestring) {
            var array = [];
            for (var i = 0, len = linestring.components.length; i < len; ++i) {
                array.push(this.extract.pointArr.apply(this, [linestring.components[i]]));
            }
            return array;
        },

        /**
        * Method: extract.multilinestring
        * Return an array of linestring arrays from a linestring.
        * 
        * Parameters:
        * linestring - {<OpenLayers.Geometry.MultiLineString>}
        * 
        * Returns:
        * {Array} An array of linestring arrays representing
        *     the multilinestring.
        */
        'multilinestring': function(multilinestring) {
            var array = [];
            for (var i = 0, len = multilinestring.components.length; i < len; ++i) {
                array.push(this.extract.linestring.apply(this, [multilinestring.components[i]]));
            }
            return array;
        },

        /**
        * Method: extract.polygon
        * Return an array of linear ring arrays from a polygon.
        *
        * Parameters:
        * polygon - {<OpenLayers.Geometry.Polygon>}
        * 
        * Returns:
        * {Array} An array of linear ring arrays representing the polygon.
        */
        'polygon': function(polygon) {
            var array = [];
            for (var i = 0, len = polygon.components.length; i < len; ++i) {
                array.push(this.extract.linestring.apply(this, [polygon.components[i]]));
            }
            return array;
        },

        /**
        * Method: extract.multipolygon
        * Return an array of polygon arrays from a multipolygon.
        * 
        * Parameters:
        * multipolygon - {<OpenLayers.Geometry.MultiPolygon>}
        * 
        * Returns:
        * {Array} An array of polygon arrays representing
        *     the multipolygon
        */
        'multipolygon': function(multipolygon) {
            var array = [];
            for (var i = 0, len = multipolygon.components.length; i < len; ++i) {
                array.push(this.extract.polygon.apply(this, [multipolygon.components[i]]));
            }
            return array;
        }


    },

    CLASS_NAME: "OpenLayers.Format.EsriJSONFormat"

});     
