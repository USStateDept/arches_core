/**
* Method: OpenLayers.Geometry.segmentsIntersect
* Determine whether two line segments intersect.  Optionally calculates
*     and returns the intersection point.  This function is optimized for
*     cases where seg1.x2 >= seg2.x1 || seg2.x2 >= seg1.x1.  In those
*     obvious cases where there is no intersection, the function should
*     not be called.
*
* Parameters:
* seg1 - {Object} Object representing a segment with properties x1, y1, x2,
*     and y2.  The start point is represented by x1 and y1.  The end point
*     is represented by x2 and y2.  Start and end are ordered so that x1 < x2.
* seg2 - {Object} Object representing a segment with properties x1, y1, x2,
*     and y2.  The start point is represented by x1 and y1.  The end point
*     is represented by x2 and y2.  Start and end are ordered so that x1 < x2.
* options - {Object} Optional properties for calculating the intersection.
*
* Valid options:
* point - {Boolean} Return the intersection point.  If false, the actual
*     intersection point will not be calculated.  If true and the segments
*     intersect, the intersection point will be returned.  If true and
*     the segments do not intersect, false will be returned.  If true and
*     the segments are coincident, true will be returned.
* tolerance - {Number} If a non-null value is provided, if the segments are
*     within the tolerance distance, this will be considered an intersection.
*     In addition, if the point option is true and the calculated intersection
*     is within the tolerance distance of an end point, the endpoint will be
*     returned instead of the calculated intersection.  Further, if the
*     intersection is within the tolerance of endpoints on both segments, or
*     if two segment endpoints are within the tolerance distance of eachother
*     (but no intersection is otherwise calculated), an endpoint on the
*     first segment provided will be returned.
*
* Returns:
* {Boolean | <OpenLayers.Geometry.Point>}  The two segments intersect.
*     If the point argument is true, the return will be the intersection
*     point or false if none exists.  If point is true and the segments
*     are coincident, return will be true (and the instersection is equal
*     to the shorter segment).
*/
OpenLayers.Geometry.segmentsIntersect = function(seg1, seg2, options) {
    var point = options && options.point;
    var tolerance = options && options.tolerance;
    var intersection = false;
    var x11_21 = seg1.x1 - seg2.x1;
    var y11_21 = seg1.y1 - seg2.y1;
    var x12_11 = seg1.x2 - seg1.x1;
    var y12_11 = seg1.y2 - seg1.y1;
    var y22_21 = seg2.y2 - seg2.y1;
    var x22_21 = seg2.x2 - seg2.x1;
    var d = (y22_21 * x12_11) - (x22_21 * y12_11);
    var n1 = (x22_21 * y11_21) - (y22_21 * x11_21);
    var n2 = (x12_11 * y11_21) - (y12_11 * x11_21);
    if (d == 0) {
        // parallel
        if (n1 == 0 && n2 == 0) {
            // coincident
            intersection = true;

            /**
            *
            *  Begin new code added by RMG
            *
            */

            // if point is true check to see if lines are coincident or merely conlinear and
            // return the shared vertex if they are only colinear
            if (point) {
                seg1.vertices = [{ x: seg1.x1, y: seg1.y1 }, { x: seg1.x2, y: seg1.y2}];
                seg2.vertices = [{ x: seg2.x1, y: seg2.y1 }, { x: seg2.x2, y: seg2.y2}];
                var allVertices = seg1.vertices.concat(seg2.vertices);
                
                // find all shared vertices
                var sharedVertices = [];
                Ext.each(seg1.vertices, function(seg1Vert, seg1VertIndex, seg1VertAllItems) {
                    Ext.each(seg2.vertices, function(seg2Vert, seg2VertIndex, seg2VertAllItems) {
                        if (seg1Vert.x == seg2Vert.x && seg1Vert.y == seg2Vert.y) {
                            sharedVertices.push(seg2Vert);
                        }
                    }, this);
                }, this);

                // if they only share one vertex, check to make sure that the segments do not overlap by
                // validating that the shared vertex falls between the non-shared ones
                if (sharedVertices.length == 1) {
                    var shared = sharedVertices[0];

                    var nonShared = [];
                    
                    // get the non-shared vertices (there should only ever be two)
                    Ext.each(allVertices, function(item, index, allItems) {
                        if (!(item.x == shared.x && item.y == shared.y)) {
                            nonShared.push(item);
                        }
                    }, this);

                    // validate that the shared vertex falls between the non-shared ones
                    if (((nonShared[0].x <= shared.x && shared.x <= nonShared[1].x) || (nonShared[1].x <= shared.x && shared.x <= nonShared[0].x)) &&
                        ((nonShared[0].y <= shared.y && shared.y <= nonShared[1].y) || (nonShared[1].y <= shared.y && shared.y <= nonShared[0].y))) {
                        intersection = new OpenLayers.Geometry.Point(shared.x, shared.y);
                    }
                }
            }

            /**
            *
            *  End new code added by RMG
            *
            */
        }
    } else {
        var along1 = n1 / d;
        var along2 = n2 / d;
        if (along1 >= 0 && along1 <= 1 && along2 >= 0 && along2 <= 1) {
            // intersect
            if (!point) {
                intersection = true;
            } else {
                // calculate the intersection point
                var x = seg1.x1 + (along1 * x12_11);
                var y = seg1.y1 + (along1 * y12_11);
                intersection = new OpenLayers.Geometry.Point(x, y);
            }
        }
    }
    if (tolerance) {
        var dist;
        if (intersection) {
            if (point) {
                var segs = [seg1, seg2];
                var seg, x, y;
                // check segment endpoints for proximity to intersection
                // set intersection to first endpoint within the tolerance
                outer: for (var i = 0; i < 2; ++i) {
                    seg = segs[i];
                    for (var j = 1; j < 3; ++j) {
                        x = seg["x" + j];
                        y = seg["y" + j];
                        dist = Math.sqrt(
                            Math.pow(x - intersection.x, 2) +
                            Math.pow(y - intersection.y, 2)
                        );
                        if (dist < tolerance) {
                            intersection.x = x;
                            intersection.y = y;
                            break outer;
                        }
                    }
                }

            }
        } else {
            // no calculated intersection, but segments could be within
            // the tolerance of one another
            var segs = [seg1, seg2];
            var source, target, x, y, p, result;
            // check segment endpoints for proximity to intersection
            // set intersection to first endpoint within the tolerance
            outer: for (var i = 0; i < 2; ++i) {
                source = segs[i];
                target = segs[(i + 1) % 2];
                for (var j = 1; j < 3; ++j) {
                    p = { x: source["x" + j], y: source["y" + j] };
                    result = OpenLayers.Geometry.distanceToSegment(p, target);
                    if (result.distance < tolerance) {
                        if (point) {
                            intersection = new OpenLayers.Geometry.Point(p.x, p.y);
                        } else {
                            intersection = true;
                        }
                        break outer;
                    }
                }
            }
        }
    }
    return intersection;
};

// zooms the map to a given WKT and optionally limits the max zoom level the map zooms to
OpenLayers.Map.prototype.zoomToWKT = function(wkt, zoomLimit) {
    var geom = new OpenLayers.Format.WKT().read(wkt).geometry;
    this.zoomToGeom(geom, zoomLimit);
};

// zooms the map to a given geometry and optionally limits the max zoom level the map zooms to
OpenLayers.Map.prototype.zoomToGeom = function(geom, zoomLimit) {
    var bounds = geom.getBounds();
    if (zoomLimit) {
        // get the zoom level at which to view the feature
        var zoom = this.getZoomForExtent(bounds, false);

        // zoom to the feature but not closer then level 17
        this.setCenter(bounds.getCenterLonLat(), Math.min(zoom, zoomLimit));
    } else {
        this.zoomToExtent(bounds);
    }
};

OpenLayers.Map.prototype.getAdjustedZoom = function() {
    return (this.getZoom() + this.min_zoom_level);
};

OpenLayers.Map.prototype.setAdjustedZoom = function() {
    this.zoomTo(unadjustedZoomLevel + this.min_zoom_level);
};

/**
Overrides original function
Fixes vector layers and markers not getting the proper z-index when first added to the map
*/    
OpenLayers.Map.prototype.Z_INDEX_BASE = {
    BaseLayer: 100,
    Overlay: 325,
    Feature: 725,
    Popup: 950,
    Control: 1000
};
OpenLayers.Map.prototype.setLayerZIndex = function (layer, zIdx) {
    layer.setZIndex(
        this.Z_INDEX_BASE[layer.isBaseLayer ? 'BaseLayer' : (layer.isVector || layer.CLASS_NAME == 'OpenLayers.Layer.Markers') ? 'Feature' : 'Overlay']
        + zIdx * 5 );
};

OpenLayers.Map.prototype.getFeatureDisplayInfo = function() {
    var returnObj = new Object();
    var redLines = new Array();
    var labels = new Array();
    var wktWriter = new OpenLayers.Format.WKT()
    for (var j = 0; j < this.drawingLayer.features.length; j++) {

        var data = {};
        if (this.drawingLayer.features[j].data.isLabel) {
            //Label Info
            data.WKT = wktWriter.write(this.drawingLayer.features[j]);
            data.FontColor = this.drawingLayer.features[j].style.fontColor;
            data.FontFamily = this.drawingLayer.features[j].style.fontFamily;
            data.FontSize = this.drawingLayer.features[j].style.fontSize;
            data.Description = this.drawingLayer.features[j].data.description;
            data.FontWeight = this.drawingLayer.features[j].style.fontWeight;
            data.Text = this.drawingLayer.features[j].style.label;
            labels.push(data);
        }
        else {
            //Redline Info
            data.WKT = wktWriter.write(this.drawingLayer.features[j]);
            data.FillColor = this.drawingLayer.features[j].style.fillColor;
            data.FillOpacity = this.drawingLayer.features[j].style.fillOpacity;
            data.OutlineColor = this.drawingLayer.features[j].style.strokeColor;
            data.OutlineOpacity = this.drawingLayer.features[j].style.strokeOpacity;
            data.ShowLabelOnMap = this.drawingLayer.features[j].data.showLabel;
            data.OutlineWidth = this.drawingLayer.features[j].style.strokeWidth;
            data.PointRadius = this.drawingLayer.features[j].style.pointRadius;
            data.IsDigHere = this.drawingLayer.features[j].attributes.isDigHere;

            //Label Info
            data.Label = {};
            if (data.WKT.contains("POINT")) {
                data.Label.WKT = data.WKT;
            }
            else if (data.WKT.contains("LINE")) {
                var wkt = this.drawingLayer.features[j].geometry.components[0];
                data.Label.WKT = "POINT(" + wkt.x + " " + wkt.y + ")";
            }
            else if (data.WKT.contains("POLYGON")) {

                var wkt = this.drawingLayer.features[j].geometry.getCentroid();
                data.Label.WKT = "POINT(" + wkt.x + " " + wkt.y + ")";
            }
            data.Label.FontColor = this.drawingLayer.features[j].style.fontColor;
            data.Label.FontFamily = this.drawingLayer.features[j].style.fontFamily;
            data.Label.FontSize = this.drawingLayer.features[j].style.fontSize;
            data.Label.Description = this.drawingLayer.features[j].data.description;
            data.Label.FontWeight = this.drawingLayer.features[j].style.fontWeight;
            data.Label.Text = this.drawingLayer.features[j].style.label;
            redLines.push(data);
        }
    }
    returnObj.redLines = redLines;
    returnObj.labels = labels;
    return returnObj;
};

