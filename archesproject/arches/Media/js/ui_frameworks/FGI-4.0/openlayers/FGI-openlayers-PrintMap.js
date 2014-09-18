//You can either pass it a bounds object for printing, or it will use the current map extent
//If we make a printing widget where you select the area to print you can just pass the bounds in
OpenLayers.Map.prototype.printMapProps = {
    requestURL: "/PlantGIS/MapService/PrintMap/",
    mapName: "Map Title",
    mapDescription: "Description",
    //Used for adding additional params to the end of a raster request URL
    //First element should be the layer name and the next should be the string you want to append to the URL
    //Layer names are even elements while the params are odd
    additionRequestParams: []
};

OpenLayers.Map.prototype.getPrintObj = function (bounds, mapName, mapDescription) {
    //Use either passed in bounds or current map extent
    var bounds = bounds || this.getExtent();

    //Create the printInfo object that I will write as JSON and send to the server
    var printInfo = null;
    printInfo = new Object();
    printInfo.mapName = mapName || OpenLayers.Map.prototype.printMapProps.mapName;
    printInfo.mapDescription = mapDescription || OpenLayers.Map.prototype.printMapProps.mapDescription;
    printInfo.bbox = new Array();
    printInfo.rasters = new Array();
    printInfo.markers = new Array();
    printInfo.vectors = new Array();

    //Push the current bounding box of the map into the bbox array of the printInfo object
    printInfo.bbox[0] = this.getExtent().left;
    printInfo.bbox[1] = this.getExtent().bottom;
    printInfo.bbox[2] = this.getExtent().right;
    printInfo.bbox[3] = this.getExtent().top;

    //Flag for find the baselayer (first layer added to rasters array
    var isBaseLayer = true;
    for (var i = 0; i < this.layers.length; i++) {
        //If the layer has a getPrintURL function defined in FGI-openlayers-LayerURLBuilder.js then push
        //it's print URL into the raster array of the printInfo object
        if (this.layers[i].getPrintURL && this.layers[i].visibility) {
            //Check to see if this layer has any additional params we want appended to the request URL
            var additionalParams = "";
            if (OpenLayers.Map.prototype.printMapProps.additionRequestParams.length > 0) {
                for (var q = 0; q < OpenLayers.Map.prototype.printMapProps.additionRequestParams.length; q++) {
                    if (OpenLayers.Map.prototype.printMapProps.additionRequestParams[q] == this.layers[i].name) {
                        additionalParams = OpenLayers.Map.prototype.printMapProps.additionRequestParams[q + 1];
                    }
                    //Want to add 2 to i so that we are only looking at layer names
                    q++;
                }
            }
            //The baselayer must be a jpg while overlays need to be transparent pngs
            //The first layer to get pushed into the rasters array needs the format to be switched to jpg
            //and the transparent parameter set to true
            if (isBaseLayer == true) {
                var baselayerURL = this.layers[i].getPrintURL(bounds, additionalParams);
                baselayerURL = baselayerURL.replace("FORMAT=png", "FORMAT=jpg");
                baselayerURL = baselayerURL.replace("TRANSPARENT=true", "");
                printInfo.rasters.push(baselayerURL);
                isBaseLayer = false;
            }
            else {
                printInfo.rasters.push(this.layers[i].getPrintURL(bounds, additionalParams));
            }
        }
        //If the layer is a Marker layer, then extact all its features info into the markerss array of
        //the printInfo object
        if (this.layers[i].markers) {
            for (var j = 0; j < this.layers[i].markers.length; j++) {
                var marker = new Object();
                marker.WKT = "POINT(" + this.layers[i].markers[j].lonlat.lon + " " + this.layers[i].markers[j].lonlat.lat + ")";
                marker.iconURL = this.layers[i].markers[j].icon.url;
                printInfo.markers.push(marker);
            }
        }
        //If the layer is a Vector layer, then extact all its features info into the vectors array of
        //the printInfo object
        if (this.layers[i].features) {
            var wktWriter = new OpenLayers.Format.WKT()

            //Loop through each feature in the vector layer
            for (var j = 0; j < this.layers[i].features.length; j++) {
                var feature = new Object();

                /* Trying to use create the object with the default style map
                var defaultStyle = function() {
                this.fillColor = this.layers[i].styleMap.styles.default.defaultStyle.fillColor;
                this.fillOpacity = this.layers[i].styleMap.styles.default.defaultStyle.fillOpacity;
                this.pointRadius = this.layers[i].styleMap.styles.default.defaultStyle.pointRadius;
                this.strokeColor = this.layers[i].styleMap.styles.default.defaultStyle.strokeColor;
                this.strokeOpacity = this.layers[i].styleMap.styles.default.defaultStyle.strokeOpacity;
                this.strokeWidth = this.layers[i].styleMap.styles.default.defaultStyle.strokeWidth;
                }
                    
                feature = defaultStyle.apply(this);
                */

                //Get the features Well-Known-Text
                feature.wkt = wktWriter.write(this.layers[i].features[j]);

                //Figure out if it is a label
                if (this.layers[i].features[j].attributes.isLabel)
                { feature.isLabel = true; }
                else { feature.isLabel = false; }

                var styleLocation;
                if (this.layers[i].features[j].attributes.style) {
                    styleLocation = this.layers[i].features[j].attributes.style;
                } else if (this.layers[i].styleMap.styles["default"].defaultStyle) {
                    styleLocation = this.layers[i].styleMap.styles["default"].defaultStyle;
                }
                else if (this.layers[i].style) {
                    styleLocation = this.layers[i].style;
                }

                //Get the title for the feature
                feature.label = styleLocation.label || "";

                //Get label styling
                feature.fontColor = styleLocation.fontColor || "#000000";
                feature.fontFamily = styleLocation.fontFamily || "aerial";
                feature.fontWeight = styleLocation.fontWeight || "1";
                feature.fontSize = styleLocation.fontSize || "18";

                //Get all the styling info for this feature
                feature.fillColor = styleLocation.fillColor || "#0000FF";
                feature.fillOpacity = styleLocation.fillOpacity || "0.3";
                feature.strokeColor = styleLocation.strokeColor || "#0000FF";
                feature.strokeOpacity = styleLocation.strokeOpacity || "1";
                feature.strokeWidth = styleLocation.strokeWidth || "3";
                feature.pointRadius = styleLocation.pointRadius || "6";


                //Push the object for this feature into the vector array in the printInfo object
                printInfo.vectors.push(feature);
            }
        }
    }

    var JSONWriter = new OpenLayers.Format.JSON();
    printInfo = JSONWriter.write(printInfo);
    return printInfo;
};

OpenLayers.Map.prototype.printMap = function(bounds, mapName, mapDescription) {

    var printInfo = OpenLayers.Map.prototype.getPrintObj.apply(this, arguments);

    ////////////////////////////////////////////////////////////////////
    /// Create a form with the POST data and set the traget to _blank
    ////////////////////////////////////////////////////////////////////

    var printForm = document.getElementById('printForm');
    printForm.setAttribute('action', OpenLayers.Map.prototype.printMapProps.requestURL);
    printForm.setAttribute('baseURI', "");
    printForm.setAttribute('URL', "");

    var input = document.getElementById('printInfo');
    input.setAttribute('value', "");
    input.setAttribute('value', printInfo);
    printForm.submit();

};