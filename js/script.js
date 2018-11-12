function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		// `DOMContentLoaded` already fired
		action();
	}
}

whenDocumentLoaded(() => {
	var urlWaterShed = "{{ site.baseurl }}/watershed.geojson";
	var urlAzote = "n_export.json";
	var urlPhosphore = "p_export.json";

	// Load the JSON file(s)
	queue()
	    .defer(d3.json, urlWaterShed) // Load Watershed Shape
	    //.defer(d3.json, urlAzote) // Load Azote metric
	    //.defer(d3.json, urlPhosphore) // Load Phosphore metric
	    .await(loadGeoJSON); // When the GeoJsons are fully loaded, call the function loadGeom

	// Function loadGeoJSON: this function is executed as soon as all the files in queue() are loaded

    function loadFile(filePath) {
		var result = null;
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", filePath, false);
		xmlhttp.send();
		if (xmlhttp.status==200) {
			result = xmlhttp.responseText;
		}
		return result;
	}

	function loadGeoJSON(error, watershed_shape){

	    var densityData = {
	        w: watershed_shape,
	        //p: density_phosphore,
	        //n: density_azote
	    };

	    var layersColorUrl = {} //placehoder for the layers, to compute them only once

	    //General Map
	    var basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	        maxZoom: 19,
	        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	    });

	    // Zoomed on Paris

	    var map = L.map('ParisMap', {zoomControl: true}).fitBounds(L.latLngBounds(new L.LatLng(49.2485668,1.4403262),new L.LatLng(48.1108602,3.5496114))); //by default, zoom in on Paris
	    basemap.addTo(map);

	    function style(feature) {
	        return {
	            opacity:0,
	            fillOpacity: 0
	        };
	    }
	    L.geoJson(watershed_shape,{style:style}).addTo(map); //needed! otherwise a svg isn't generated, we use this one for practical purposes

	    var svg = d3.select("#ParisMap").select("svg")

	    var imgs = svg.selectAll("image").data([0,0]);
	    imgs.enter()
	        .append("svg:image")
	        .attr('x', 0)
	        .attr('y', 0)
	        .attr("xlink:href", "")

	    function projectPoint(x, y) {
	        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
	        this.stream.point(point.x, point.y);
	    }

	    transform = d3.geo.transform({point: projectPoint});
	    var path = d3.geo.path()
	        .projection(transform);
	    var watersheds = svg.append("g").selectAll("path")
	        .data(watershed_shape.features)
	        .enter().append('path')
	            .attr('d', path)
	            .attr('vector-effect', 'non-scaling-stroke')
	            .style('stroke', "#000")
	            .attr("fill","none")

	    function getColour(d){
	        return  d > 200 ? '1c1ae3':
	                d > 150 ? '2a4efc':
	                d > 100 ? '3c8dfd':
	                d > 50 ? '4cb2fe':
	                          'ccffff';
	    }
	    

	    var canvas = document.createElement("canvas")
	    var context = canvas.getContext('2d');

	    var currentUpdateFunction = getColour(0)

	    function setLayer(newLayerUrl){
	    	if (!layersColorUrl[newLayerUrl]){
				var json = loadFile(newLayerUrl)
				var image_data = JSON.parse(json)
				image_data.data=JSON.parse(image_data.data)
				console.log(image_data)

				image_width=image_data.width
				image_height=image_data.height
			    //var densityDataChosen = densityData["p"]; //phosphore for now

		        canvas.width=image_width//image_data.width
		        canvas.height=image_height//image_data.width

		        var img = document.getElementById("my-image")
		    	canvas.getContext('2d').drawImage(img, 0, 0, image_width, image_height);

			    var context = canvas.getContext('2d');

			    var pixels = image_data.data//context.getImageData(0, 0, canvas.width, canvas.height).data

			    var imageData=context.createImageData(image_width, image_height);
			    // The property data will contain an array of int8
			    var data=imageData.data;

			    for (var i=0; i<canvas.height*canvas.width; i++) {
			        var px = i%canvas.width
			        var py = i/canvas.width
			        //var value = getRasterPixelValue(i%canvas.width,i/canvas.width)
			        if(px >= 0 && px < image_width && py >= 0 && py < image_height){
			            pos = i*4

			            var value = pixels[i]
			            //var v = (value - mean)/(std*2) + 0.5;
			            data[pos]   = parseInt(getColour(value),16) & 255
			            data[pos+1]   = (parseInt(getColour(value),16) >> 8) & 255
			            data[pos+2]   = (parseInt(getColour(value),16) >> 16) & 255
			            if (pixels[i]==0){
			                data[pos+3]=0; // alpha (transparency)
			            }
			            else{
			                data[pos+3]=180;
			            }
			        }
			    }
			    context.putImageData(imageData, 0, 0); // at coords 0,0

			    var value=canvas.toDataURL("png");

			    imgs.attr("xlink:href",value)
			    layersColorUrl[newLayerUrl]={"url":value,
											"tl_lat":image_data.tl_lat,
											"tl_lng":image_data.tl_lng,
											"br_lat":image_data.br_lat,
											"br_lng":image_data.br_lng,
											"width":image_width,
											"height":image_height}
			    console.log("ok!")
			}

			info = layersColorUrl[newLayerUrl]
			image_width=info.width
			image_height=info.height
		    //var densityDataChosen = densityData["p"]; //phosphore for now

	        canvas.width=image_width//image_data.width
	        canvas.height=image_height//image_data.width

		    var tl = new L.LatLng(info.tl_lat,info.tl_lng)
		    var br = new L.LatLng(info.br_lat,info.br_lng)

		    function update() {
		        var width = (map.latLngToLayerPoint(br).x-map.latLngToLayerPoint(tl).x)
		        var height = (map.latLngToLayerPoint(br).y-map.latLngToLayerPoint(tl).y)
		        imgs.attr("transform", 
		            function(d) { 
		                var point = map.latLngToLayerPoint(tl)
		                return "translate("+ 
		                    point.x +","+ 
		                    point.y +")";
		            }
		        )
		        imgs.attr("width", 
		            function(d) { 
		                return width;
		            }
		        )
		        imgs.attr("height", 
		            function(d) { 
		                return height;
		            }
		        )
		        watersheds.attr("d",path)
		    }
		    map.off("viewreset",currentUpdateFunction)
		    map.on("viewreset", update);
		    currentUpdateFunction = update
		    update();

		    document.getElementById("my-second-image").src=info.url
		    imgs.attr("xlink:href",info.url)
		    console.log("ok!")
		}
		setLayer(urlPhosphore)
		document.getElementById("azoteLayer").addEventListener("click",function(){
			setLayer(urlAzote)
		})
		document.getElementById("phosphoreLayer").addEventListener("click",function(){
			setLayer(urlPhosphore)
		})
	}
});

