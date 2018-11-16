function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		// `DOMContentLoaded` already fired
		action();
	}
}

whenDocumentLoaded(() => {
	var urlDepartment = "depts.geojson";
	var urlWaterShed = "watershed.geojson";
	var urlVoronoi = "sd-voronoi.json";
	var urlAzote = "n_export.json";
	var urlPhosphore = "p_export.json";

	// Load the JSON file(s)
	queue()
	    .defer(d3.json, urlDepartment) // Load Watershed Shape
	    //.defer(d3.json, urlWaterShed) // Load Watershed Shape
	    .defer(d3.json, urlVoronoi) // Load Voronoi Shape
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

	function loadGeoJSON(error, department_shape, voronoi_shape){

	    var densityData = {
	        //w: watershed_shape,
	        d: department_shape,
	        v: voronoi_shape,
	        //p: density_phosphore,
	        //n: density_azote
	    };

	    var layersColorUrl = {} //placehoder for the layers, to compute them only once

	    //General Map
	    var basemap = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
	        maxZoom: 14, //toner light won't go further than 14
	        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	    });

	    // Zoomed on Paris

	    var defaultBounds = L.latLngBounds(new L.LatLng(49.2485668,1.4403262),new L.LatLng(48.1108602,3.5496114))
	    var map = L.map('ParisMap', {zoomControl: true}).fitBounds(defaultBounds); //by default, zoom in on Paris
	    basemap.addTo(map);

	    function style(feature) {
	        return {
	            opacity:0,
	            fillOpacity: 0
	        };
	    }
	    L.geoJson(department_shape,{style:style}).addTo(map); //needed! otherwise a svg isn't generated, we use this one for practical purposes

	    var svg = d3.select("#ParisMap").select("svg")

	    var imgs = svg.selectAll("image").data([0])
	    	.enter()
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
	    var voronoi = svg.append("g").selectAll("path")
	        .data(voronoi_shape.features)
	        .enter().append('path')
	            .attr('d', path)
	            .attr('vector-effect', 'non-scaling-stroke')
	            .style('stroke', "#000")
	            .attr("fill","#4444")
	            .attr("fill-opacity","0")
	            .on("mouseover",function(d,i){
	            	d3.select(this).style('fill-opacity', 1);
	            })
	            .on("mouseout",function(d,i){
	            	d3.select(this).style('fill-opacity', 0);
	            })
	            .on("click",function(d,i){
	            	departments.style("pointer-events","all")
	            	map.fitBounds(defaultBounds) // zoom to department
	            })
	    var departments = svg.append("g").selectAll("path")
	        .data(department_shape.features)
	        .enter().append('path')
	            .attr('d', path)
	            .attr('vector-effect', 'non-scaling-stroke')
	            .style('stroke', "#000")
	            .attr("fill","#4444")
	            .attr("fill-opacity","0")
	            .style("stroke-width","2")
	            .style("pointer-events", "all")
	            .on("mouseover",function(d,i){
	            	d3.select(this).style('fill-opacity', 1);
	            })
	            .on("mouseout",function(d,i){
	            	d3.select(this).style('fill-opacity', 0);
	            })
	            .on("click",function(d,i){
	            	departments.style("pointer-events","all") // now we cannot click/hover departments
	            	d3.select(this).style("pointer-events","none") // now we cannot click/hover departments
	            	var BBox = d3.select(this).node().getBBox()
	            	var neBound = map.layerPointToLatLng(L.point(BBox.x,BBox.y))
	            	var swBound = map.layerPointToLatLng(L.point(BBox.x+BBox.width,BBox.y+BBox.height))
	            	map.fitBounds(L.latLngBounds(neBound,swBound)) // zoom to department
	            })


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

				image_width=image_data.width
				image_height=image_data.height
			    //var densityDataChosen = densityData["p"]; //phosphore for now

		        canvas.width=image_width//image_data.width
		        canvas.height=image_height//image_data.width

		        var img = document.getElementById("my-image")
		    	//canvas.getContext('2d').drawImage(img, 0, 0, image_width, image_height);

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
			                data[pos+3]=100;//was 180
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
		        departments.attr("d",path)
		        voronoi.attr("d",path)
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

