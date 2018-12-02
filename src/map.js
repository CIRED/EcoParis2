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
    maxZoom: 14, // Toner Light won't zoom further than 14.
    attribution: MAP_ATTRIB
  })

  base.addTo(map)
  return map
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

function paraseMeans(data){
    let data_splitted = data.split("\n")
    data_splitted.pop()//last line does not contain a value!
    return data_splitted.map((d) => parseFloat(d))
}

function loadContainmentFile(url){
    var json = loadFile(url)
    var containment = JSON.parse(json)
    containment.data = JSON.parse(containment.data)
    return containment
}

function getColour(d){
    return  d > 200 ? 'e31a1c':
            d > 150 ? 'fc4e2a':
            d > 100 ? 'fd8d3c':
            d > 50 ? 'feb24c':
                      'ffffcc';
}

export default function (element, error, interComm_shape, voronoi_shape) {
  var current_geoLat = 0.0;
  var current_geoLong = 0.0;
  var display_coord = 0; //Do not display the localisation marker
  var geomarker;

  // This needs to leave.
  const default_tl = new L.LatLng(49.2485668,1.4403262)
  const default_br = new L.LatLng(48.1108602,3.5496114)
  const initialBounds = L.latLngBounds(default_tl, default_br)

  const map = createMap(element, initialBounds) //TODO: if the window is small, the zoom is too far (> 14) and the map is grey, untill we zoom in

  function blankStyle(feature) {
      return {
          opacity:0,
          fillOpacity: 0
      };
  }
  L.geoJson(interComm_shape,{style:blankStyle}).addTo(map); //needed! otherwise a svg isn't generated, we use this one for practical purposes

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


    var emptyOpacity = 0
    var fadedOpacity = 0.4
    var semiFullOpacity = 0.7
    var fullOpacity = 1
    var current_layer = ""

    var voronoi = svg.append("g").selectAll("path")
        .data(voronoi_shape.features)
        .enter().append('path')
            .attr('d', path)
            .attr('vector-effect', 'non-scaling-stroke')
            .style('stroke', "#666")
            .style("fill-opacity",emptyOpacity)
            .style("stroke-opacity",emptyOpacity)
            .on("mouseover",function(d,i){
              d3.select(this).style('fill-opacity', emptyOpacity);
              defs_path.datum(d.geometry)
              update_clip()
              update_chart(i,current_layer,true)
            })
            .on("mouseout",function(d,i){
              if (highlightedInterComm != -1){
                //console.log(highlightedInterComm,i)
                d3.select(this).style('fill-opacity', oneIfInInterComm(highlightedInterComm)(d,i));
                d3.select(this).style('stroke-opacity', oneIfInInterComm(highlightedInterComm)(d,i));
              }

              defs_path.datum([])
              update_clip()
            })
            .on("click",function(d,i){
              interComms.style("pointer-events","all")
              map.fitBounds(initialBounds) // zoom back to paris
              highlightedInterComm = -1
              interComms.style("fill-opacity",fullOpacity)
              voronoi.style("fill-opacity",emptyOpacity)
              voronoi.style("stroke-opacity",emptyOpacity)

              defs_path.datum([])
              update_clip()
            })

    var highlightedInterComm = -1
    function oneIfInInterComm(interCommIndex){
      function oneIfInInterComm_(p,j){
        if (firstVoronoiByInterComm[interCommIndex] <= j && (interCommIndex == interComm_shape.features.length-1 || firstVoronoiByInterComm[interCommIndex+1] > j)){
          return 1
        }
        else{
          return 0
        }
      }
      return oneIfInInterComm_
    }
    var interComms = svg.append("g").selectAll("path")
        .data(interComm_shape.features)
        .enter().append('path')
            .attr('d', path)
            .attr('vector-effect', 'non-scaling-stroke')
            .style('stroke', "#333")
            .attr("fill","#4444")
            .attr("fill-opacity",fullOpacity)
            .style("pointer-events", "all")
            .on("mouseover",function(d,i){
              if (highlightedInterComm != -1){
                if (i != highlightedInterComm){
                  d3.select(this).style('fill-opacity', fullOpacity);
                }
                else{
                  d3.select(this).style('fill-opacity', emptyOpacity);
                }
              }
              else{
                d3.select(this).style('fill-opacity', fadedOpacity);
              }
              update_chart(i,current_layer,false)
            })
            .on("mouseout",function(d,i){
              if (highlightedInterComm != -1){
                if (i == highlightedInterComm){
                  d3.select(this).style('fill-opacity', emptyOpacity);
                }
                else{
                  d3.select(this).style('fill-opacity', fadedOpacity);
                }
              }
              else{
                d3.select(this).style('fill-opacity', fullOpacity);
              }
            })
            .on("click",function(d,i){
              interComms.style("pointer-events","all") // now we can click/hover on every department
              d3.select(this).style("pointer-events","none") // except the current one!

              interComms.style("fill-opacity",fadedOpacity) //same here, show every intercomm except this one
              d3.select(this).style('fill-opacity', emptyOpacity);
              highlightedInterComm = i


              voronoi.style("fill-opacity", oneIfInInterComm(i))
              voronoi.style("stroke-opacity", oneIfInInterComm(i))

              var BBox = d3.select(this).node().getBBox()
              var neBound = map.layerPointToLatLng(L.point(BBox.x,BBox.y))
              var swBound = map.layerPointToLatLng(L.point(BBox.x+BBox.width,BBox.y+BBox.height))
                map.fitBounds(L.latLngBounds(neBound,swBound)) // zoom to department
            })

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
        for (var k=0; k<interComm_shape.features.length; ++k){
            if (d3.geoContains(interComm_shape.features[k],[current_geoLong,current_geoLat])){
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


    function update_chart (i,layerURl,voro){
      var info = layersColorUrl[layerURl]
      if(!info){
        return ;
      }
      if(voro=true){
        var data = info.voronoi_hist[i]
      }
      else{
        var data = info.interComm_hist[i]
      }

      console.log(data)
      var myBarChart = new Chart(context, {
        type: 'bar',
        data: data,
      });

    }


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
        interComms.attr("d",path)
        voronoi.attr("d",path)
        update_clip()

       	marker_image.attr("transform",
       		function(d) {
       			var point = map.latLngToLayerPoint([current_geoLat,current_geoLong])
                return "translate("+
                    (point.x - greenIcon.iconAnchor[0]) +","+
                    (point.y - greenIcon.iconAnchor[1]) +")";
       		})
    }

    var voronoiContainment = loadContainmentFile("data/voronoi_cont.json")
    var interCommContainment = loadContainmentFile("data/intercomm_cont.json")

    var firstVoronoiByInterComm = []

    var layersColorUrl = {} //placehoder for the layers, to compute them only once
    function setLayer(newLayerUrl){
      console.log('SETTING LAYER', newLayerUrl)

      if (!layersColorUrl[newLayerUrl]){
        var json = loadFile(newLayerUrl)
        var GeoImage = JSON.parse(json)
        GeoImage.data = JSON.parse(GeoImage.data)
        var pixels = GeoImage.data;

        canvas.width = GeoImage.width
        canvas.height = GeoImage.height

        var tempContext = canvas.getContext("2d");
        tempContext.createImageData(canvas.width,canvas.height);

        var len = canvas.height*canvas.width;
        var workersCount = 1;
        var finished = 0;
        var segmentLength = len / workersCount;
        var blockSize = canvas.height / workersCount;

        //initalize means and counts arrays
        var voronoi_means = []
        var voronoi_counts = []
        var voronoi_hist = {}

        for (var i=0; i<voronoi_shape.features.length; ++i){
          voronoi_counts[i] = 0
          voronoi_means[i] = 0
          voronoi_hist[i] = []
        }

        var interComm_means = []
        var interComm_counts = []
        var interComm_hist = {}

        for (var i=0; i<interComm_shape.features.length; ++i){
          interComm_counts[i] = 0
          interComm_means[i] = 0
          interComm_hist[i] = []
        }

        firstVoronoiByInterComm = []
        for (var i=0; i<interComm_shape.features.length; ++i){
          firstVoronoiByInterComm[i] = 10000 //bigger than the max, ~670
        }


        var onWorkEnded = function (e) {
            var canvasData = e.data.result;
            var index = e.data.index;

            var interComm_counts_portion = e.data.interComm_counts
            var interComm_means_portion = e.data.interComm_means
            var voronoi_counts_portion = e.data.voronoi_counts
            var voronoi_means_portion = e.data.voronoi_means
            var firstVoronoiByInterCommPortion = e.data.firstVoronoiByInterComm
            var voronoi_hist_portion = e.data.voronoi_hist
            var interComm_hist_portion = e.data.interComm_hist

            for (var i=0; i<voronoi_shape.features.length; ++i){
              voronoi_counts[i] += voronoi_counts_portion[i]
              voronoi_means[i] += voronoi_means_portion[i]
              voronoi_hist[i] = voronoi_hist[i].concat(voronoi_hist_portion[i])
            }

            for (var i=0; i<interComm_shape.features.length; ++i){
              interComm_counts[i] += interComm_counts_portion[i]
              interComm_means[i] += interComm_means_portion[i]
              interComm_hist[i] = interComm_hist[i].concat(interComm_hist_portion[i])

              if (firstVoronoiByInterComm[i] > firstVoronoiByInterCommPortion[i]){
                firstVoronoiByInterComm[i] = firstVoronoiByInterCommPortion[i]
              }
            }

            tempContext.putImageData(canvasData, 0, blockSize * index);
            finished++;

            //console.log(voronoi_means)
            if (finished == workersCount) {

              for (var i=0; i<voronoi_shape.features.length; ++i){
                if (voronoi_counts[i] != 0){
                  voronoi_means[i] /= voronoi_counts[i]
                }
              }
              for (var i=0; i<interComm_shape.features.length; ++i){
                if (interComm_counts[i] != 0){
                  interComm_means[i] /= interComm_counts[i]
                }
              }

              var value = canvas.toDataURL("png");
              imgs.attr("xlink:href",value)
              layersColorUrl[newLayerUrl]={"url":value,
                          "tl_lat":GeoImage.tl_lat,
                          "tl_lng":GeoImage.tl_lng,
                          "br_lat":GeoImage.br_lat,
                          "br_lng":GeoImage.br_lng,
                          "width":canvas.width,
                          "height":canvas.height,
                          "voronoi_means":voronoi_means,
                          "interComm_means":interComm_means,
                          "voronoi_hist":voronoi_hist,
                          "interComm_hist":interComm_hist,
                          "layerUrl":newLayerUrl}

              setLayerComputed();
              //console.log(firstVoronoiByInterComm)
            }
        };

        for (var index = 0; index < workersCount; index++) {
            var worker = new Worker("assets/pictureProcessor.js");
            worker.onmessage = onWorkEnded;
            var canvasData = tempContext.getImageData(0, blockSize * index, canvas.width, blockSize);
            worker.postMessage({canvasData: canvasData,
                                pixels:pixels,
                                index: index,
                                length: segmentLength,
                                width: canvas.width,
                                height:canvas.height,
                                containmentWidth : voronoiContainment.width,
                                containmentHeight : voronoiContainment.height,
                                voronoiContainmentData : voronoiContainment.data,
                                interCommContainmentData : interCommContainment.data,
                                numVoronois : voronoi_shape.features.length,
                                numInterComms : interComm_shape.features.length});
        }


      }
      else{
        setLayerComputed();
      }


      function setLayerComputed(){
        var info = layersColorUrl[newLayerUrl]
        var colour_mean = d3.scale.linear() //change fill color according to current layer and means
                .range(['#ffffcc','#e31a1c'])
                .domain([Math.min(...info.voronoi_means),Math.max(...info.voronoi_means)])


        var colour_mean2 = d3.scale.linear() //change fill color according to current layer and means
                .range(['#ffffcc','#e31a1c'])
                .domain([Math.min(...info.interComm_means),Math.max(...info.interComm_means)])

        voronoi.attr("fill",function(d,i){
              return colour_mean(info.voronoi_means[i])
            })
        interComms.attr("fill",function(d,i){
              return colour_mean(info.interComm_means[i])
            })

            canvas.width=info.width//GeoImage.width
            canvas.height=info.height//GeoImage.width

          var tl = new L.LatLng(info.tl_lat,info.tl_lng)
          var br = new L.LatLng(info.br_lat,info.br_lng)

          update_parameters.tl = tl
          update_parameters.br = br
          update_parameters.current_geoLat = current_geoLat
          update_parameters.current_geoLong = current_geoLong

          update()
          current_layer = newLayerUrl
          imgs.attr('xlink:href', info.url)
      }

    }
	map.on('viewreset', update)

  return setLayer
}
