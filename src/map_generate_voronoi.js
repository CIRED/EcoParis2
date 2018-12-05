
// ========== INSTRUCTIONS ==========

/*
 * Use this page to recompute voronois areas when you plan to change the main areas (currently interComms)
 * (warning: this process is quite slow by itself, but it requires humain feedback because the computed voronois
 * are sometimes corrupted, well you'll see.)
 *
 *  STEPS:
 *    - [1] in src/components/Map.vue, change the url of the geojson shapefile
 *    - below, set depts_to_compute to range({total number of shapes in your geojson})
 *    - in src/components/Map.vue, make sure displayMap is imported from "../map_generate_voronoi", and not "../map_check_voronoi"
 *    - run the page locally ("npm run serve"), and load the page, it will take a while!
 *       (about half a minute or so per area, open the console beforehand to get feedback if you cannot open it during computations,
 *        simply set depts_to_compute to [], load and open the console, then set it back and reload)
 *    - once done, zoom in in the center of paris, maximum level of zoom (that actually affects the precision of the voronoi shapes, it is important to have a perfect fit!)
 *      (the shape won't display correctly but don't worry it is correctly computed) and download your json from the right pannel
 *    - [2] now, you'll need to actually check the areas manually. in src/components/Map.vue, make sure displayMap is imported from "../map_check_voronoi" this time
 *    - still in this file, set the name of your new voronoi
 *    - reload the page, now you can check your voronois.
 *    - for each area, check every voronoi to see if there are shapes cut in two or that go beyond the department we are in
 *    - if so, write down the id of the department (printed on the console while you hover it) and the ids of every voronoi inside (should be consecutive)
 *    - when you're done, redo everything from [1] to [2] included, but this time save the json as a second file, and set to depts_to_compute the set of shapes that contains invalid voronois (don't worry, it will be much faster)
 *    - set the name of your NEW json in src/components/Map.vue
 *    - for all areas that contains voronois (so the new ones), check that it valid. If not, you will recompute it in another iteration, if it is correct this time,
 *      write down the ids of the voronois shapes inside. You'll need to replace them in your very first json file (remember, you have written down their ids in the first json)
 *      say you wanted to correct areas 100-109, and the new ones are correct, ids 10-18, then you will need to open the jsons, copy shapes 10-18 and paste them in the first json,
 *      where areas 100-109 where. (An area starts with this: ({"type": "Feature",
                                                                  "properties": {},
                                                                  ...
                                                                })
 *    - by going back-and-forth, you can correct every invalid voronoi and replace them in your initial file, so iterate until everything looks fine, it gets faster and faster
 *    (for some reasons, some voronoi shapes are generated in an incorrect point order ([counter]clock-wise)). If you get weird results after you also updated the containment file,
 *    console.log the results of d3.geoContains(voronoi_shape.features[i],default_tl) for each voronoi i, and the positive tests are the voronois you need to invert, i.e. [a,b,c,a] => [a,c,b,a])
 */

var depts_to_compute = [12] 
//var depts_to_compute = range(n) // n being the number of interComms (64) (check with department_shape.features.legth once the page is loaded)






var urlAzote = 'data/n_export.json'
var urlPhosphore = 'data/p_export.json'

const MAP_TILES = 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png'
const MAP_ATTRIB = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'

/**
 * Creates a Leaflet map of the Paris area and returns it.
 */
function createMap(element, initialBounds) {
  const map = L.map(element, { zoomControl: false })
  map.fitBounds(initialBounds)

  const base = L.tileLayer(MAP_TILES, {
    minZoom: 9,
    maxZoom: 17, // Toner Light won't zoom further than 14.
    attribution: MAP_ATTRIB
  })

  base.addTo(map)
  return map
}



export default function (element, error, department_shape, voronoi_shape) {
  // This needs to leave.
  const default_tl = new L.LatLng(49.2485668,1.4403262)
  const default_br = new L.LatLng(48.1108602,3.5496114)
  const initialBounds = L.latLngBounds(default_tl, default_br)

  var layersColorUrl = {} //placehoder for the layers, to compute them only once

  const map = createMap(element, initialBounds) //TODO: if the window is small, the zoom is too far (> 14) and the map is grey, untill we zoom in

  function style(feature) {
      return {
          opacity:0,
          fillOpacity: 0
      };
  }
  L.geoJson(department_shape,{style:style}).addTo(map); //needed! otherwise a svg isn't generated, we use this one for practical purposes

  var svg = d3.select(element).select("svg")

  function projectPoint(x, y) {
      var point = map.latLngToLayerPoint(new L.LatLng(y, x));
      this.stream.point(point.x, point.y);
  }
  var transform = d3.geo.transform({point: projectPoint});

  var path = d3.geo.path()
      .projection(transform);

  var defs = svg.append("defs");

  var defs_path = defs.append("path")
      .attr("id", "clip_path")

  defs.append("clipPath")
      .attr("id", "clip")
      .append("use")
      .attr("xlink:href", "#clip_path");

    var imgs = svg.selectAll("image").data([0])
      .enter()
        .append("svg:image")
        .attr('x', 0)
        .attr('y', 0)
        .attr("xlink:href", "")
        .attr("clip-path","url(#clip)")

    function update_clip(){

      function clip_projectPoint(x, y) {
      var width = (map.latLngToLayerPoint(default_br).x-map.latLngToLayerPoint(default_tl).x)
      var height = (map.latLngToLayerPoint(default_br).y-map.latLngToLayerPoint(default_tl).y)
        var tx = (x - default_tl.lng)/(default_br.lng - default_tl.lng) * (width-1)
        var ty = (default_tl.lat+0.00314 - y)/(default_tl.lat - default_br.lat) * (height-1) //it is slightly offset, and I have no idea why
        this.stream.point(tx, ty);
      }
        
      var clip_transform = d3.geo.transform({point: clip_projectPoint});
      var clip_path = d3.geo.path()
          .projection(clip_transform);
        defs_path.attr("d",clip_path)
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

  function parseMeans(data){
        let data_splitted = data.split("\n")
        data_splitted.pop()//last line does not contain a value!
        return data_splitted.map((d) => parseFloat(d))
  }

    function getColour(d){
        return  d > 200 ? 'e31a1c':
                d > 150 ? 'fc4e2a':
                d > 100 ? 'fd8d3c':
                d > 50 ? 'feb24c':
                          'ffffcc';
    }
    
    var current_geoLat = 0.0;
    var current_geoLong = 0.0;
    var display_coord = 0; //Do not display the localisation marker
    var geomarker;
            
    var departments = svg.append("g").selectAll("path")
        .data(department_shape.features)
        .enter().append('path')
            .attr('d', path)
            .attr('vector-effect', 'non-scaling-stroke')
            .style('stroke', "#333")
            .attr("fill","#4444")
            //.attr("fill-opacity","0")
            .style("pointer-events", "all")
            .on("mouseover",function(d,i){
              //d3.select(this).style('fill-opacity', 1);
            })
            .on("mouseout",function(d,i){
              //d3.select(this).style('fill-opacity', 0);
            })
            .on("click",function(d,i){
              departments.style("pointer-events","all") // now we can click/hover on every department
              d3.select(this).style("pointer-events","none") // except the current one!
              var BBox = d3.select(this).node().getBBox()
              var neBound = map.layerPointToLatLng(L.point(BBox.x,BBox.y))
              var swBound = map.layerPointToLatLng(L.point(BBox.x+BBox.width,BBox.y+BBox.height))
                map.fitBounds(L.latLngBounds(neBound,swBound)) // zoom to department
            })

    var polygons = svg.append("g").attr("class","polygons")

    var greenIcon = {
        iconUrl: 'assets/marker.png',
        iconSize: [24, 24],
        iconAnchor: [12, 24]
    };

    var marker_image = svg.append("g").selectAll("image").data([0])
      .enter()
        .append("svg:image")
        .attr("xlink:href", greenIcon.iconUrl)
        .attr("width",greenIcon.iconSize[0])
        .attr("height",greenIcon.iconSize[1])
        .style("pointer-events", "none")

    var categories_canvas = d3.select("body").append("g").append("canvas")

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition) // call showPosition when finished
            
        } else {
            x.innerHTML = "Geolocation is not supported by this browser.";
        }
    }

    function showPosition(position) {
        //current_geoLat = position.coords.latitude;
        //current_geoLong = position.coords.longitude;
        current_geoLat = 48.864716;
        current_geoLong = 2.349014;
        for (var k=0; k<department_shape.features.length; ++k){
            if (d3.geoContains(department_shape.features[k],[current_geoLong,current_geoLat])){
                display_coord = 1;
            }
      }
    }
    showPosition(null)
    //getLocation();

    var canvas = document.createElement("canvas")
    var context = canvas.getContext('2d');
    var currentUpdateFunction = getColour(0)//litteraly anything other than null

    var update_parameters = {};

	function update() { //add here everything that could potentially change
		var tl = update_parameters.tl
		var br = update_parameters.br
		var current_geoLat = update_parameters.current_geoLat
		var current_geoLong = update_parameters.current_geoLong

      	console.log('UPDATING')
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
        update_clip()

       	marker_image.attr("transform", 
       		function(d) {
       			var point = map.latLngToLayerPoint([current_geoLat,current_geoLong])
                return "translate("+ 
                    (point.x - greenIcon.iconAnchor[0]) +","+ 
                    (point.y - greenIcon.iconAnchor[1]) +")";
       		})
          // if(display_coord){
          //     map.addLayer(geomarker);
          // }

        var fc = {'type': 'FeatureCollection','features': []}
      var poly = '{"type": "Feature","properties": {},"geometry": {"type": "Polygon","coordinates": []}}'
      for (var k=0; k<depts_to_compute.length; ++k){
        var i = depts_to_compute[k]
        var department_index = i
        function imageToLatLng(x,y){
              var tx = x/(update_parameters.width-1)
              var ty = y/(update_parameters.height-1)
              return L.latLng(tl.lat * (1-ty) + br.lat * ty, tl.lng * (1-tx) + br.lng * tx)
        }

        var json_data = update_parameters.centers[department_index]
        var voronoi_ = d3.voronoi()
            .x(function(d) { return map.latLngToLayerPoint(imageToLatLng(d.x,d.y)).x; })
            .y(function(d) { return map.latLngToLayerPoint(imageToLatLng(d.x,d.y)).y; })
            .extent([[-1000000, -1000000], [1000000, 1000000]]);
            
        var voronoi_clipped_data = voronoi_(json_data).polygons().map(function(d) {
                var mapped = department_shape.features[department_index].geometry.coordinates[0].map(function(p) {
                    var projected_pt = map.latLngToLayerPoint(L.latLng(p[1],p[0]))
                    return [projected_pt.x,projected_pt.y]
                });
                var polygon_mask = d3.geom.polygon(mapped)
                var polygon = d3.geom.polygon(d)
                var clipped = polygon.clip(polygon_mask) 
                return clipped
            })
            
        console.log(voronoi_clipped_data)
        var voronoi_clipped = polygons
            .selectAll("path")
            .data(voronoi_clipped_data)
            .enter()
            .append("path")
            .attr("d",function(d){return ((d != null && d.length != 0) ? "M"+d.join("L")+"Z" : "") })
            .style("stroke", function(d){  return "#000000"} )
            .style("fill","none");
            
            voronoi_clipped_data.forEach(p => {
                let feature = JSON.parse(poly)
                p.reverse().push(p[0])
                p = p.map((d) => {
                  var mapped = map.layerPointToLatLng(d)
                  return [mapped.lng,mapped.lat]
                })
                //console.log(p)
                feature.geometry.coordinates.push(p)
                fc.features.push(feature)
            })

        
      }
      download(JSON.stringify(fc, null, 2), 'voronois.json', "json", 8)
          function download(text, name, type, id) {
          d3.select(".container").append("a").attr("id","a"+id)
        var a = document.getElementById("a"+id);
        var file = new Blob([text], {type: type});
        a.href = URL.createObjectURL(file);
        a.innerHTML="Click here to download "+name
          d3.select(".container").append("br")
        a.download = name;
        console.log("downloadable!")
      }
    }

    function setLayer(newLayerUrl){
      console.log('SETTING LAYER', newLayerUrl)
      if (!layersColorUrl[newLayerUrl]){
      var json = loadFile(newLayerUrl)
      var image_data = JSON.parse(json)
      image_data.data=JSON.parse(image_data.data)

      var points = []
      for (var i=0; i<department_shape.features.length; ++i){
        points[i]=[]
      }

      var image_width=image_data.width
      var image_height=image_data.height
        //var densityDataChosen = densityData["p"]; //phosphore for now

          canvas.width=image_width//image_data.width
          canvas.height=image_height//image_data.width

        var context = canvas.getContext('2d');
        var pixels = image_data.data;

        var imageData=context.createImageData(image_width, image_height);
        // The property data will contain an array of int8
        var data=imageData.data;

        for (var i=0; i<canvas.height*canvas.width; i++) {
            var px = i%canvas.width
            var py = i/canvas.width
            //var value = getRasterPixelValue(i%canvas.width,i/canvas.width)
            if(px >= 0 && px < image_width && py >= 0 && py < image_height){
                var pos = i*4

                var value = pixels[i]

                var tx = px/(image_data.width-1)
                var ty = py/(image_data.height-1)
                for (var j=0; j<depts_to_compute.length; ++j){
                  var k = depts_to_compute[j]
                  if (d3.geoContains(department_shape.features[k],[image_data.tl_lng * (1-tx) + image_data.br_lng*tx,image_data.tl_lat * (1-ty) + image_data.br_lat*ty])){
                    points[k].push({x:px,y:py,value:value})
                    break;
                  }
                }
                if (px == 0){
                  console.log(py)
                }

                data[pos+2]   = parseInt(getColour(value),16) & 255
                data[pos+1]   = (parseInt(getColour(value),16) >> 8) & 255
                data[pos]   = (parseInt(getColour(value),16) >> 16) & 255
                if (pixels[i]==0){
                    data[pos+3]=0; // alpha (transparency)
                }
                else{
                    data[pos+3]=220;
                }
            }
        }

      var centers = kmeans(points)

      update_parameters.centers = centers
      update_parameters.width = image_data.width
      update_parameters.height = image_data.height

      imgs.attr("xlink:href",value)
      layersColorUrl[newLayerUrl]={"url":value,
                  "tl_lat":image_data.tl_lat,
                  "tl_lng":image_data.tl_lng,
                  "br_lat":image_data.br_lat,
                  "br_lng":image_data.br_lng,
                  "width":image_width,
                  "height":image_height,
                  "layerUrl":newLayerUrl,
                  "means_intdpt":means_intdpt}
      
      }

      var info = layersColorUrl[newLayerUrl]
      var means_intdpt = info.means_intdpt
      var colour_mean = d3.scale.linear() //change fill color according to current layer and means
              .range(['#ffffcc','#e31a1c'])
              .domain([Math.min(...means_intdpt),Math.max(...means_intdpt)])

      departments.attr("fill",function(d,i){
            return colour_mean(means_intdpt[i])
          })

      image_width=info.width
      image_height=info.height

          canvas.width=image_width//image_data.width
          canvas.height=image_height//image_data.width

        var tl = new L.LatLng(info.tl_lat,info.tl_lng)
        var br = new L.LatLng(info.br_lat,info.br_lng)

        update_parameters.tl = tl
        update_parameters.br = br
        update_parameters.current_geoLat = current_geoLat
        update_parameters.current_geoLong = current_geoLong

        update()
        imgs.attr('xlink:href', info.url)
    }
	map.on('viewreset', update)
  
  return setLayer
}

function kmeans(groups){
  var results = []
  for (var i=0; i<groups.length; ++i){
    var points = groups[i]
    var num_clusters = 10

    var max_x = d3.max(points,(d) => d.x)
    var max_y = d3.max(points,(d) => d.y)

    var min_x = d3.min(points,(d) => d.x)
    var min_y = d3.min(points,(d) => d.y)

    var centers = new Array(num_clusters)
    var clusters = new Array(num_clusters)
    for (var j=0; j<num_clusters; ++j){
      centers[j] = {x:d3.randomUniform(min_x, max_x)(),y:d3.randomUniform(min_y, max_y)()}
      clusters[j] = []
    }
    console.log(centers)
    for (var iter=0; iter<50; ++iter){
      points.forEach((d) => {
        var dists = computeDistances(centers,d)
        var min = 10000;
        var argmin = 0;

        for (var j=0; j<dists.length; ++j){
          if (min >= dists[j]){
            min = dists[j]
            argmin = j
          }
        }

        clusters[argmin].push(d)
      })

      centers = computeCentroids(clusters)
    }

    results.push(centers.filter(d => d.x>0))
  }
  return results
}


function computeCentroids(clusters) {
            
    var centroids = clusters.map(cluster => {

        var d = cluster;

        var x_sum = d3.sum(d, d => d.x * d.value),
            y_sum = d3.sum(d, d => d.y * d.value);

        var count_sum = d3.sum(d, d => d.value);
        var n = count_sum;

        return { x:(x_sum / n), y:(y_sum / n) };

    });

    return centroids;
}

function computeDistances(centroids, d_pt) {

    var dists = centroids.map(centroid => {
        var dist = Math.sqrt(Math.pow(d_pt.x - centroid.x, 2) + Math.pow(d_pt.y - centroid.y, 2));
        return dist;
    })
    return dists;
}