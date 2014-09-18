//This method allows me to alter the urls in one convient place, but with the ArcGIS93Rest layers the really is no point since I just call getURL(bounds)

OpenLayers.Layer.ArcGIS93Rest.prototype.getPrintURL = function(bounds, additionalParams) {
    bounds = this.adjustBounds(bounds);
    var addParams = additionalParams || "";
    // ArcGIS Server only wants the numeric portion of the projection ID.
    var projWords = this.projection.getCode().split(":");
    var srid = projWords[projWords.length - 1];

    var imageSize = this.getImageSize();
    var newParams = {
        'BBOX': bounds.toBBOX(),
        //'SIZE': imageSize.w + "," + imageSize.h,
        'SIZE': "TEMPIMAGEWIDTH" + "," + "TEMPIMAGEHEIGHT",
        // We always want image, the other options were json, image with a whole lotta html around it, etc.
        'F': "image",
        'BBOXSR': srid,
        'IMAGESR': srid,
        'FORMAT': 'png',
        'TRANSPARENT': true
    };

    // Now add the filter parameters.
    if (this.layerDefs) {
        var layerDefStrList = [];
        var layerID;
        for (layerID in this.layerDefs) {
            if (this.layerDefs.hasOwnProperty(layerID)) {
                if (this.layerDefs[layerID]) {
                    layerDefStrList.push(layerID);
                    layerDefStrList.push(":");
                    layerDefStrList.push(this.layerDefs[layerID]);
                    layerDefStrList.push(";");
                }
            }
        }
        if (layerDefStrList.length > 0) {
            newParams['LAYERDEFS'] = layerDefStrList.join("");
        }
    }
    var requestString = this.getFullRequestString(newParams);
    return requestString + addParams;
};

OpenLayers.Layer.ArcGISCache.prototype.getPrintURL = function(bounds, additionalParams) {
    var addParams = additionalParams || "";
    // ArcGIS Server only wants the numeric portion of the projection ID.
    var projWords = this.projection.getCode().split(":");
    var srid = projWords[projWords.length - 1];

    var imageSize = this.getImageSize();
    var newParams = {
        'BBOX': bounds.toBBOX(),
        //'SIZE': imageSize.w + "," + imageSize.h,
        'SIZE': "TEMPIMAGEWIDTH" + "," + "TEMPIMAGEHEIGHT",
        // We always want image, the other options were json, image with a whole lotta html around it, etc.
        'F': "image",
        'BBOXSR': srid,
        'IMAGESR': srid,
        'FORMAT': 'png',
        'TRANSPARENT': true
    };

    // Now add the filter parameters.
    if (this.layerDefs) {
        var layerDefStrList = [];
        var layerID;
        for (layerID in this.layerDefs) {
            if (this.layerDefs.hasOwnProperty(layerID)) {
                if (this.layerDefs[layerID]) {
                    layerDefStrList.push(layerID);
                    layerDefStrList.push(":");
                    layerDefStrList.push(this.layerDefs[layerID]);
                    layerDefStrList.push(";");
                }
            }
        }
        if (layerDefStrList.length > 0) {
            newParams['LAYERDEFS'] = layerDefStrList.join("");
        }
    }
    var requestString = this.getFullRequestString(newParams);

    requestString = requestString.replace('MapServer/tile', 'MapServer/export');
    //Get the service and build a URL for the REST service
    //var domain = requestString.substring(0, requestString.indexOf("arcgiscache"));
    //var service = requestString.substring(requestString.indexOf("arcgiscache") + 12);
    //service = service.substring(0, service.indexOf("/"));
    //requestString = domain + "ArcGIS/rest/services/" + service + "/MapServer/export" + requestString.substring(requestString.indexOf("?"));

    return requestString +addParams;
};