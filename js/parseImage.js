/**
 *	Use this page to parse new geotiffs (or .tif[f]) and convert them to the json the website uses (but this part is easily done locally, no need for the actual server).
 *	(keep in mind that my program is in french, translations might not be exact)
 *  (Ok apparently htis can only run on Safari (I did not test them all though), Google Chrome cannot load tif images, sorry about that)
 *
 *	STEPS:
 *
 *		- Open QGIS
 *		- Open your tiff file with it
 *		- On the "layers" pannel, select your tiff and right-click, export => save as...
 *		- Output mode, select image
 *		- (Choose file location/name, and write its name down there)
 *		- SCR: choose default (EPSG:4326 - WGS 84)
 *		- Write down the North/East/West/South values down there
 *		- Go back to SCR = EPSG-102110-RGF_1993_Lambert_93 (or whatever it was, actually)
 *		- Save
 *		- Choose bin thresholds for the categories of the histograms on the right (values go from 0 to 255, choose an array of separators)
 *		- Write down there whether the values are discrete or not (typically true for the "espaces_verts" raster file, only three categories there)
 *		- Run the server locally (npm won't work here, "python -m http.server" will do)
 *		- At the bottom of the page, download you file.
 */

// ========= CHANGE PARAMETERS HERE =========

var FileName = "espaces_verts_image.tif"
var OutputFileName = "espaces_verts.json" //.json

var North = 49.235386374 // espaces verts
var South = 48.111114327
var West = 1.458223266
var East = 3.565682555

var HistogramBins = [80,160] //3 categories: 0-80, 81-160, 161-255

var AreValuesDiscrete = true //typically true when a pixel color is a category


function whenDocumentLoaded(action) {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", action);
	} else {
		// `DOMContentLoaded` already fired
		action();
	}
}


whenDocumentLoaded(() => {

	document.getElementById("my-image").src=FileName

	var urlDPT = "depts.geojson";
	var urlVoronoi = "sd-voronoi.json";

	// Load the JSON file(s)
	queue()
	    .defer(d3.json, urlDPT) // Load Watershed Shape
	    .defer(d3.json, urlVoronoi) // Load Voronoi Shape
	    .await(loadGeoJSON); // When the GeoJsons are fully loaded, call the function loadGeom


	function loadGeoJSON(error, dpt_shape, voronoi_shape){

	    var tl = new L.LatLng(North,West)
	    var br = new L.LatLng(South,East)


	    var img = document.getElementById('my-image');
	    var image_width = img.width
	    var image_height = img.height

	    var canvas = document.createElement("canvas")
	        canvas.width=image_width//image_data.width
	        canvas.height=image_height//image_data.width

	    
	    function getColour(d){ //this doesn't affect the json at all, but tweak a bit if you want to choose nice colours while you can see the whole image
	        return  d > 200 ? '1c1ae3':
	                d > 150 ? '2a4efc':
	                d > 100 ? '3c8dfd':
	                d > 50 ? '4cb2fe':
	                          'ccffff';
	    }

	    canvas.getContext('2d').drawImage(img, 0, 0, image_width, image_height);
	    var context = canvas.getContext('2d');

	    var pixels = context.getImageData(0, 0, canvas.width, canvas.height).data

	    var imageData=context.createImageData(image_width, image_height);
	    // The property data will contain an array of int8
	    var data=imageData.data;

		var myArray=[]

		var objective_width = 1943 //same as our reference image, so that the image is not too big (8000 x 6000...)
		var objective_height = 1586

	    for (var i=0; i<objective_height*objective_width; i++) {
	        var px = Math.floor((i%objective_width) * canvas.width / objective_width)
	        var py = Math.floor(Math.floor(i/objective_width) * (canvas.height / objective_height))

	        if(px >= 0 && px < image_width && py >= 0 && py < image_height){
	            pos = (px + py * canvas.width)*4

	            //console.log(px,py)
	            var value = pixels[pos]

	            //this part is actually not useful, but it is nice to see the result beforehand
	            var reference_size_pos = (Math.floor(i / objective_width) * canvas.width + (i % objective_width))*4
	            data[reference_size_pos]   = parseInt(getColour(value),16) & 255 //r
	            data[reference_size_pos+1]   = (parseInt(getColour(value),16) >> 8) & 255 //g
	            data[reference_size_pos+2]   = (parseInt(getColour(value),16) >> 16) & 255 //b
	            if (pixels[pos+3]==0){
	                data[reference_size_pos+3]=0; // alpha (transparency)
	                value = NaN //transparent pixel ==> no data
	            }
	            else{
	                data[reference_size_pos+3]=180;
	            }
	        	myArray[i]=value;
	        	
	        	if (px == 0){
	        		console.log(py+'/'+canvas.height)
	        	}
	        }
	        else{
	        	myArray[i]=0;
	        }
	    }
	    var sorted = myArray.slice().filter(x => x == x) //remove NaNs
	    sorted.sort((x,y) => parseInt(x)>parseInt(y))

	    var percentiles = []

	    for (var i=4; i>0; --i){
	    	percentiles = []
	    	for (var j=1; j<i; ++j){
	    		percentiles[j-1] = sorted[Math.floor(sorted.length * j/i)]
	    	}
	    	if (percentiles[0] == 0 || percentiles[percentiles.length-1] == 255){
	    		continue;
	    	}
	    	var previous =-1;
	    	var stop = true
	    	for (var j=0; j<percentiles.length; ++j){
	    		if (previous == percentiles[j]){
	    			stop = false
	    		}
	    		previous = percentiles[j]
	    	}
	    	if (stop){
	    		break
	    	}
	    }

	    if (AreValuesDiscrete){
	    	percentiles = []
	    	while (sorted.length > 0){
	    		var percentile = sorted[0]
	    		percentiles.push(percentile)
	    		sorted = sorted.filter(x => x != percentile)
	    	}
	    	if (percentiles[0] == 0){
		    	percentiles.shift()
		    }
		    if (percentiles[percentiles.length-1] == 255){
		    	percentiles.pop()
		    }
	    }

	    console.log(percentiles)
	    //console.log(JSON.stringify(myArray))
	    function download(text) {
	      d3.select(".container").append("a").attr("id","a_image")
		  var a = document.getElementById("a_image");
		  var file = new Blob([text], {type: 'json'});
		  a.href = URL.createObjectURL(file);
		  a.innerHTML="Click here to download "+OutputFileName
	      d3.select(".container").append("br")
		  a.download = OutputFileName;
		}

		download(JSON.stringify({"width":objective_width,
								"height":objective_height,
								"tl_lat":tl.lat,
								"tl_lng":tl.lng,
								"br_lat":br.lat,
								"br_lng":br.lng,
								"percentiles":JSON.stringify(percentiles),
								"buckets":JSON.stringify(HistogramBins),
								"data":JSON.stringify(myArray)}))

	    context.putImageData(imageData, 0, 0); // at coords 0,0

	    var value=canvas.toDataURL("png");
	    document.getElementById("my-second-image").src=value
	    alert("Conversion succesful!")

	}
});

