function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		// `DOMContentLoaded` already fired
		action();
	}
}

whenDocumentLoaded(() => {
	var urlWaterShed = "depts.geojson";
	var urlAzote = "n_export.geojson";
	var urlPhosphore = "p_export.geojson";

	// Load the JSON file(s)
	queue()
	    .defer(d3.json, urlWaterShed) // Load Watershed Shape
	    //.defer(d3.json, urlAzote) // Load Azote metric
	    //.defer(d3.json, urlPhosphore) // Load Phosphore metric
	    .await(loadGeoJSON); // When the GeoJsons are fully loaded, call the function loadGeom

	// Function loadGeoJSON: this function is executed as soon as all the files in queue() are loaded

	function loadGeoJSON(error, watershed_shape){

	    var densityData = {
	        w: watershed_shape,
	        //p: density_phosphore,
	        //n: density_azote
	    };
	    //var densityDataChosen = densityData["p"]; //phosphore for now


	    //General Map
	    var basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	        maxZoom: 19,
	        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	    });

	    var tl = new L.LatLng(49.2485668,1.4403262)
	    var br = new L.LatLng(48.1108602,3.5496114)

	    // Zoomed on Paris
	    var map = L.map('ParisMap', {zoomControl: true}).fitBounds(L.latLngBounds(tl,br));
	    basemap.addTo(map);

	    function style(feature) {
	        return {
	            opacity:0,
	            fillOpacity: 0
	        };
	    }

	    L.geoJson(watershed_shape,{style:style}).addTo(map);

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
        console.log(watershed_shape.features)
	    var watersheds = svg.append("g").selectAll("path")
	        .data(watershed_shape.features)
	        .enter().append('path')
	            .attr('d', path)
	            .attr('vector-effect', 'non-scaling-stroke')
	            .style('stroke', "#000")
	            .attr("fill","none")

	    var img = document.getElementById('my-image');
	    var image_width = img.width
	    var image_height = img.height

	    var canvas = document.createElement("canvas")
	        canvas.width=image_width//image_data.width
	        canvas.height=image_height//image_data.width

        var polygons = svg.append("g").attr("class","polygons")

		function noop() {}
        function projectLineString(feature, projection) {
		  var line;
		  d3.geo.stream(feature, projection.stream({
		    polygonStart: noop,
		    polygonEnd: noop,
		    lineStart: function() { line = []; },
		    lineEnd: noop,
		    point: function(x, y) { line.push([x, y]); },
		    sphere: noop
		  }));
		  return line;
		}
        console.log(watershed_shape.features[7])

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

	        var vertices = [[972.823,274.289],
		    				[454.092,159.518],
		    				[346.149,162.919],
		    				[248.585,111.850],
		    				[450.367,255.928],
		    				[695.151,212.843],
		    				[250.092,220.071],
		    				[579.122,148.726],
		    				[596.864,284.037],
		    				[733.488,371.636],
		    				[830.057,194.852],
		    				[875.546,341.312]]
        
	        var json_data = []
	        vertices.forEach(function(d,i){
	            json_data.push({x:d[0], y:d[1]})
	        });

	        function imageToLatLng(x,y){
	        	var tx = x/(image_width-1)
		        var ty = y/(image_height-1)
	        	return L.latLng(tl.lat * (1-ty) + br.lat * ty, tl.lng * (1-tx) + br.lng * tx)
	        }

            var voronoi = d3.voronoi()
	            .x(function(d) { return map.latLngToLayerPoint(imageToLatLng(d.x,d.y)).x; })//todo convert
	            .y(function(d) { return map.latLngToLayerPoint(imageToLatLng(d.x,d.y)).y; })//todo convert
	            .extent([[0, 0], [canvas.width, canvas.height]]);;

            var test = polygons
            	.selectAll("path")
            	.data(voronoi(json_data).polygons().map(function(d) {
		        // Each voronoi region is a convex polygon, therefore we can use
		        // d3.geom.polygon.clip, treating each regino as a clip region, with the
		        // projected “exterior” as a subject polygon.
		        console.log("and....")
		        var mapped = watershed_shape.features[7].geometry.coordinates[0].map(p => {
		        	//return p
		        	//console.log(p)
		        	return [map.latLngToLayerPoint(L.latLng(p[1],p[0])).x,map.latLngToLayerPoint(L.latLng(p[1],p[0])).y] // <===== ICI?
		        });
		        console.log(mapped)
		        console.log(d)
		        //var clipped = d3.polygonClip([[0,0],[0,700],[700,700],[700,100],[500,0],[0,0]], d) //"marche"
		        var clipped = d3.polygonClip(clipped, d) //marche pas
		        console.log(clipped)
		        return clipped
		      }))
            console.log(voronoi(json_data).polygons())
            test.enter().append("path")

            polygons.selectAll("path")
            	.attr("d",function(d){return "M"+d.join("L")+"Z"; })
                .style("stroke", function(d){  return "#000000"} )
                .style("fill","none");
	    }
	    map.on("viewreset", update);
	    update();
	    function getColour(d){
	        return  d > 200 ? '1c1ae3':
	                d > 150 ? '2a4efc':
	                d > 100 ? '3c8dfd':
	                d > 50 ? '4cb2fe':
	                          'ccffff';
	    }
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

	    canvas.getContext('2d').drawImage(img, 0, 0, image_width, image_height);
	    var context = canvas.getContext('2d');

	    var pixels = context.getImageData(0, 0, canvas.width, canvas.height).data

	    var imageData=context.createImageData(image_width, image_height);
	    // The property data will contain an array of int8
	    var data=imageData.data;
	    //var mean=26.22;
	    //var std=52.05

	    

		var myArray=[]
		var string=""
		console.log(watershed_shape.features)
	    for (var i=0; i<canvas.height*canvas.width; i++) {
	        var px = i%canvas.width
	        var py = Math.floor(i/canvas.width)
	        //var value = getRasterPixelValue(i%canvas.width,i/canvas.width)
	        if(px >= 0 && px < image_width && py >= 0 && py < image_height){
	            pos = i*4

	            var value = pixels[i*4]
	            //var v = (value - mean)/(std*2) + 0.5;
	            data[pos]   = parseInt(getColour(value),16) & 255
	            data[pos+1]   = (parseInt(getColour(value),16) >> 8) & 255
	            data[pos+2]   = (parseInt(getColour(value),16) >> 16) & 255
	            if (pixels[i*4]==0){
	                data[pos+3]=0; // alpha (transparency)
	            }
	            else{
	                data[pos+3]=180;
	            }
	        	myArray[i]=value;

	        	var tx = px/(canvas.width-1)
	        	var ty = py/(canvas.height-1)
	        	/*if (d3.geoContains(watershed_shape.features[7],[tl.lng * (1-tx) + br.lng*tx,tl.lat * (1-ty) + br.lat*ty])){
	        		for (var j=0; j<value/51; ++j){
		        		string += ""+px+","+py+"\n"
		        	}
	        	}*/
	        	if (px == 0){
	        		console.log(py)
	        	}
	        	//console.log(i)
	        }
	        else{
	        	myArray[i]=0;
	        }
	    }
	    //console.log(JSON.stringify(myArray))
	    function download(text, name, type) {
		  var a = document.getElementById("a");
		  var file = new Blob([text], {type: type});
		  a.href = URL.createObjectURL(file);
		  a.download = name;
		}
		console.log(img.width,img.height)
		/*download(JSON.stringify({"width":img.width,
								"height":img.height,
								"tl_lat":tl.lat,
								"tl_lng":tl.lng,
								"br_lat":br.lat,
								"br_lng":br.lng,
								"data":JSON.stringify(myArray)}),"p_export.json","json")*/
		download(string,"points.txt","txt")
	    // we put this random image in the context
	    context.putImageData(imageData, 0, 0); // at coords 0,0


	    var value=canvas.toDataURL("png");
	    document.getElementById("my-second-image").src=value

	    imgs.attr("xlink:href",value)
	    console.log("ok!")
	}
});

