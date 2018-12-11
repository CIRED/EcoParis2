import Config from './config.json'

var urlAzote = 'data/n_export.json'
var urlPhosphore = 'data/p_export.json'

const MAP_TILES = 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png'
const MAP_ATTRIB = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//TODO: use geojsons to compute defautl viewport, will work better if changed in the future by NatCap
/**
 * Creates a Leaflet map of the Paris area and returns it.
 */
function createMap(element, initialBounds) {
  const map = L.map(element, {
    zoomControl: false
  })
  map.fitBounds(initialBounds)

  const base = L.tileLayer(MAP_TILES, {
    minZoom: 9,
    maxZoom: 14, // Toner Light won't zoom further than 14.
    attribution: MAP_ATTRIB
  })

  base.addTo(map)
  return map
}

/**
 * Loads a JSON containment file and parses it.
 */
function loadContainmentFile(url) {
  return fetch(url)
    .then(res => res.json())
    .then(json => {
      json.data = JSON.parse(json.data)
      return json
    })
}

export default function(element, error, interComm_shape, voronoi_shape, onHistChange, onSchools) {
  var current_geoLat = null;
  var current_geoLong = null;

  const default_tl = new L.LatLng(
    Config.viewport.topLatitude,
    Config.viewport.leftLongitude
  )
  const default_br = new L.LatLng(
    Config.viewport.bottomLatitude,
    Config.viewport.rightLongitude
  )
  const initialBounds = L.latLngBounds(default_tl, default_br)

  /**
   * Returns whether a given point is within the Paris region.
   */
  function isWithinParis(point) {
    return interComm_shape.features.some(s => d3.geoContains(s, point))
  }

  /**
   * Sets the position of the geolocation marker.
   */
  function setLocation(lat, lng) {
    if (!lat || !lng || !isWithinParis([lng, lat])) {
      lat = null
      lng = null
      map.fitBounds(initialBounds)
    } else {
      map.panTo(new L.LatLng(lat, lng))
      map.setZoom(11)
    }

    current_geoLat = lat
    current_geoLong = lng
    updateMarker()
  }

  /**
   * Updates the marker element on the map with the right coordinates.
   */
  function updateMarker() {
    if (current_geoLat && current_geoLong) {
      const point = map.latLngToLayerPoint([current_geoLat, current_geoLong])
      const x = point.x - markerIcon.iconAnchor[0]
      const y = point.y - markerIcon.iconAnchor[1]
      markerElement.attr('visibility', 'visible')
      markerElement.attr('transform', `translate(${x}, ${y})`)
    } else {
      markerElement.attr('visibility', 'hidden')
    }
  }

  /**
   * Sets the position of the geolocation marker to the current position
   * of the user (computed using the Geolocation API).
   */
  function setLocationFromCurrent() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setLocation(pos.coords.latitude, pos.coords.longitude)
      })
    }
  }

  setLocationFromCurrent()

  const map = createMap(element, initialBounds) //TODO: if the window is small, the zoom is too far (> 14) and the map is grey, untill we zoom in

  function blankStyle(feature) {
    return {
      opacity: 0,
      fillOpacity: 0
    };
  }
  L.geoJson(interComm_shape, {
    style: blankStyle
  }).addTo(map); //needed! otherwise a svg isn't generated, we use this one for practical purposes

  var svg = d3.select(element).select("svg")

  function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
  }
  var transform = d3.geo.transform({
    point: projectPoint
  });
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
    .attr("clip-path", "url(#clip)")

  function update_clip() {

    function clip_projectPoint(x, y) {

      var default_tl_point = map.latLngToLayerPoint([cachedLayers[currentLayerPath].tl_lat, cachedLayers[currentLayerPath].tl_lng])
      var default_br_point = map.latLngToLayerPoint([cachedLayers[currentLayerPath].br_lat, cachedLayers[currentLayerPath].br_lng])

      var width = (default_br_point.x - default_tl_point.x)
      var height = (default_br_point.y - default_tl_point.y)

      var point = map.latLngToLayerPoint(L.latLng(y, x))

      var tx = (point.x - default_tl_point.x) / (default_br_point.x - default_tl_point.x) * (width - 1)
      var ty = (point.y - default_tl_point.y) / (default_br_point.y - default_tl_point.y) * (height - 1)

      this.stream.point(tx, ty);
    }

    var clip_transform = d3.geo.transform({
      point: clip_projectPoint
    });
    var clip_path = d3.geo.path()
      .projection(clip_transform);
    defs_path.attr("d", clip_path)
  }


  var emptyOpacity = 0
  var fadedOpacity = 0.4
  var semiFullOpacity = 0.7
  var fullOpacity = 1
  var currentLayerPath = ""

  var svg_EV = d3.select("body").append("svg")
                  .attr("id","espacesVerts_")
                  .attr("width",450)
                  .attr("height",300)
                  .attr("style","margin-left:200px;")

  var imgs_EV = svg_EV.selectAll("image").data([0])
    .enter()
    .append("svg:image")
    .attr('x', 0)
    .attr('y', 0)
    .attr("xlink:href", "")

  var shape_EV = svg_EV.append("g")
  shape_EV
    .selectAll("path")
    .data([interComm_shape.features[0]])
    .enter().append('path')
    .attr('vector-effect', 'non-scaling-stroke')
    .style('stroke', "#000")
    .style("fill-opacity", 0)
    .style("stroke-opacity", 1)


  function update_EV_preview(shape_feature){

    var layer_path = Config.EV_path
    if (!cachedLayers[Config.EV_path]){
      layer_path = currentLayerPath //if not loaded yet, approximate it by the currently selected layer
    }

    //console.log(shape_feature)
    //console.log(d3.geo.bounds(shape_feature))

    var upper_lat = d3.max(shape_feature.geometry.coordinates[0], p => p[1])
    var lower_lat = d3.min(shape_feature.geometry.coordinates[0], p => p[1])
    var left_lng = d3.min(shape_feature.geometry.coordinates[0], p => p[0])
    var right_lng = d3.max(shape_feature.geometry.coordinates[0], p => p[0])

    var svg_width = parseInt(svg_EV.style("width").replace("px",""))
    var svg_height = parseInt(svg_EV.style("height").replace("px",""))

    var svg_ratio = svg_width/svg_height

    var shape_tl_point = map.latLngToLayerPoint([upper_lat, left_lng])
    var shape_br_point = map.latLngToLayerPoint([lower_lat, right_lng])

    var shape_ratio = (shape_br_point.x - shape_tl_point.x)/(shape_br_point.y - shape_tl_point.y)
    //console.log(shape_ratio)

    var EV_width = 0
    var EV_height = 0

    if (svg_ratio < shape_ratio){ // wider than svg ==> limiting factor = width
      EV_width = svg_width
      EV_height = svg_width / shape_ratio
    }
    else{ //else, higher than svg ==> limiting factor = height
      EV_height = svg_height
      EV_width = svg_height * shape_ratio
    }

    //TODO: correct slight shift
    //floating point imprecisions? ==> try computations in pixels rather than lat/lng

    var shape_in_image_left_tx = (left_lng - cachedLayers[layer_path].tl_lng) / (cachedLayers[layer_path].br_lng - cachedLayers[layer_path].tl_lng)
    var shape_in_image_right_tx = (right_lng - cachedLayers[layer_path].tl_lng) / (cachedLayers[layer_path].br_lng - cachedLayers[layer_path].tl_lng)
    var shape_in_image_top_ty = (cachedLayers[layer_path].tl_lat - upper_lat) / (cachedLayers[layer_path].tl_lat - cachedLayers[layer_path].br_lat)
    var shape_in_image_bottom_ty = (cachedLayers[layer_path].tl_lat - lower_lat) / (cachedLayers[layer_path].tl_lat - cachedLayers[layer_path].br_lat)

    var tl_pixel_x = shape_in_image_left_tx * cachedLayers[layer_path].width //pixels in the image (from 0 to image_width-1) where the bounds of the shape is
    var tl_pixel_y = shape_in_image_top_ty * cachedLayers[layer_path].height
    var br_pixel_x = shape_in_image_right_tx * cachedLayers[layer_path].width
    var br_pixel_y = shape_in_image_bottom_ty * cachedLayers[layer_path].height

    var shape_width_in_pixels = br_pixel_x - tl_pixel_x
    var shape_height_in_pixels = br_pixel_y - tl_pixel_y

    //console.log(cachedLayers[currentLayerPath].width/shape_width_in_pixels)
    //console.log(cachedLayers[currentLayerPath].height/shape_height_in_pixels)

    var real_zoom_factor = Math.min(EV_width / shape_width_in_pixels, EV_height / shape_height_in_pixels)

    //console.log(real_zoom_factor)

    var real_image_width = cachedLayers[layer_path].width * real_zoom_factor
    var real_image_height = cachedLayers[layer_path].height * real_zoom_factor

    var real_tl_pixel_x = shape_in_image_left_tx * real_image_width
    var real_tl_pixel_y = shape_in_image_top_ty * real_image_height
    var real_br_pixel_x = shape_in_image_right_tx * real_image_width
    var real_br_pixel_y = shape_in_image_bottom_ty * real_image_height

    imgs_EV.attr('width', real_image_width)
    imgs_EV.attr('height', real_image_height)

    imgs_EV.attr("transform",
      function(d) {
        return "translate(" +
          (-real_tl_pixel_x + (svg_width - EV_width) / 2) + "," +
          (-real_tl_pixel_y + (svg_height - EV_height) / 2) + ")";
      }
    )

    function projectPoint(x, y) {
      var in_image_tx = (x - cachedLayers[layer_path].tl_lng) / (cachedLayers[layer_path].br_lng - cachedLayers[layer_path].tl_lng)
      var in_image_ty = (cachedLayers[layer_path].tl_lat - y) / (cachedLayers[layer_path].tl_lat - cachedLayers[layer_path].br_lat)

      var in_image_x = in_image_tx * real_image_width
      var in_image_y = in_image_ty * real_image_height
      //console.log(in_image_x,in_image_y)

      var point = L.point(in_image_x, in_image_y);
      this.stream.point(point.x - real_tl_pixel_x + (svg_width - EV_width) / 2, point.y - real_tl_pixel_y + (svg_height - EV_height) / 2);
    }
    var transform = d3.geo.transform({
      point: projectPoint
    });
    var path = d3.geo.path()
      .projection(transform);

    //console.log(shape_width_in_pixels,shape_height_in_pixels)
    //console.log(EV_width,EV_height)



    var shape_EV_data = shape_EV.selectAll("path").data([shape_feature])
    shape_EV_data.attr("d",path)
    shape_EV_data.enter().append("path")
      .attr('vector-effect', 'non-scaling-stroke')
      .style('stroke', "#000")
      .style("fill-opacity", 0)
      .style("stroke-opacity", 1)
  }

  var voronoi = svg.append("g").selectAll("path")
    .data(voronoi_shape.features)
    .enter().append('path')
    .attr('d', path)
    .attr('vector-effect', 'non-scaling-stroke')
    .style('stroke', "#666")
    .style("fill-opacity", emptyOpacity)
    .style("stroke-opacity", emptyOpacity)
    .on("mouseover", function(d, i) {
      d3.select(this).style('fill-opacity', emptyOpacity);
      defs_path.datum(d.geometry)
      update_clip()
      update_chart(i, currentLayerPath, true)
      update_EV_preview(d)
      update_text_school(i, currentLayerPath, true)
    })
    .on("mouseout", function(d, i) {
      if (highlightedInterComm != -1) {
        d3.select(this).style('fill-opacity', oneIfInInterComm(highlightedInterComm)(d, i));
        d3.select(this).style('stroke-opacity', oneIfInInterComm(highlightedInterComm)(d, i));
      }

      defs_path.datum([])
      update_clip()
    })
    .on("click", function(d, i) {
      interComms.style("pointer-events", "all")
      map.fitBounds(initialBounds) // zoom back to paris
      highlightedInterComm = -1
      interComms.style("fill-opacity", fullOpacity)
      voronoi.style("fill-opacity", emptyOpacity)
      voronoi.style("stroke-opacity", emptyOpacity)

      defs_path.datum([])
      update_clip()
    })

  var highlightedInterComm = -1

  function oneIfInInterComm(interCommIndex) {
    function oneIfInInterComm_(p, j) {
      if (firstVoronoiByInterComm[interCommIndex] <= j && (interCommIndex == interComm_shape.features.length - 1 || firstVoronoiByInterComm[interCommIndex + 1] > j)) {
        return 1
      } else {
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
    .attr("fill", "#fff")
    .attr("fill-opacity", fullOpacity)
    .style("pointer-events", "all")
    .on("mouseover", function(d, i) {
      if (highlightedInterComm != -1) {
        if (i != highlightedInterComm) {
          d3.select(this).style('fill-opacity', fullOpacity);
        } else {
          d3.select(this).style('fill-opacity', emptyOpacity);
        }
      } else {
        d3.select(this).style('fill-opacity', fadedOpacity);
      }
      //console.log(i)
      update_chart(i, currentLayerPath, false)
      update_EV_preview(d)
      update_text_school(i, currentLayerPath, false)
    })
    .on("mouseout", function(d, i) {
      if (highlightedInterComm != -1) {
        if (i == highlightedInterComm) {
          d3.select(this).style('fill-opacity', emptyOpacity);
        } else {
          d3.select(this).style('fill-opacity', fadedOpacity);
        }
      } else {
        d3.select(this).style('fill-opacity', fullOpacity);
      }
    })
    .on("click", function(d, i) {
      interComms.style("pointer-events", "all") // now we can click/hover on every department
      d3.select(this).style("pointer-events", "none") // except the current one!

      interComms.style("fill-opacity", fadedOpacity) //same here, show every intercomm except this one
      d3.select(this).style('fill-opacity', emptyOpacity);
      highlightedInterComm = i


      voronoi.style("fill-opacity", oneIfInInterComm(i))
      voronoi.style("stroke-opacity", oneIfInInterComm(i))

      var BBox = d3.select(this).node().getBBox()
      var neBound = map.layerPointToLatLng(L.point(BBox.x, BBox.y))
      var swBound = map.layerPointToLatLng(L.point(BBox.x + BBox.width, BBox.y + BBox.height))
      map.fitBounds(L.latLngBounds(neBound, swBound)) // zoom to department
    })

  const markerIcon = {
    iconUrl: 'assets/marker.png',
    iconSize: [24, 24],
    iconAnchor: [12, 24]
  }

  let markerElement = svg.append("g").selectAll("image").data([0])
    .enter()
    .append("svg:image")
    .attr("xlink:href", markerIcon.iconUrl)
    .attr("width", markerIcon.iconSize[0])
    .attr("height", markerIcon.iconSize[1])
    .attr('visibility', 'hidden')
    .style("pointer-events", "none")

  var canvas = document.createElement("canvas")
  var context = canvas.getContext('2d');

  var update_parameters = {
    hide: true,
  };

  function update_chart(i, layerURL, voro) {
    var info = cachedLayers[layerURL]
    if (!info) {
      return;
    }
    if (voro == true) {
      var data = info.voronoi_hist[i]
    } else {
      var data = info.interComm_hist[i]
    }

    var buckets = []
    for (var j = 0; j < info.hist_buckets.length + 1; ++j) {
      buckets[j] = 0
    }

    data.forEach((d, j) => {
      for (var j = 0; j < info.hist_buckets.length; ++j) {
        if (d <= info.hist_buckets[j]) {
          // FIXME(liautaud): Does it make sense to plot 0 values on the histograms?
          if (d > 0) {
            buckets[j]++;
          }
          return;
        }
      }
      buckets[info.hist_buckets.length]++ //larger than any separation ==> in the last bucket!
    })

    onHistChange(data, buckets)
  }
  
  function update_text_school(i, layerURL, voro){
      if(layerURL==Config.Urban_cooling){
          var info = cachedLayers[Config.Ecole_path]
            if (!info) {
                return;
            }
            if (voro == true) {
              var data = info.voronoi_hist[i]
            } else {
              var data = info.interComm_hist[i]
            }
            onSchools(data)
            // change texte according to data 
      }
      else{
          onSchools(null)
      }
      
  }


  function update() {//add here everything that could potentially change
    if (update_parameters.hide) {
      console.log('hidden!')
      interComms.attr('visibility', 'hidden')
      voronoi.attr('visibility', 'hidden')
      imgs.attr('visibility', 'hidden')
      imgs_EV.attr('visibility', 'hidden')
      return;
    } else {
      interComms.attr('visibility', 'visible')
      voronoi.attr('visibility', 'visible')
      imgs.attr('visibility', 'visible')
      imgs_EV.attr('visibility', 'visible')
    }

    var tl = update_parameters.tl
    var br = update_parameters.br

    console.log('UPDATING')
    var width = (map.latLngToLayerPoint(br).x - map.latLngToLayerPoint(tl).x)
    var height = (map.latLngToLayerPoint(br).y - map.latLngToLayerPoint(tl).y)
    imgs.attr("transform",
      function(d) {
        var point = map.latLngToLayerPoint(tl)
        return "translate(" +
          point.x + "," +
          point.y + ")";
      }
    )

    imgs.attr('width', width)
    imgs.attr('height', height)
    interComms.attr("d", path)
    voronoi.attr("d", path)
    update_clip()
    updateMarker()
  }

  map.on('viewreset', update)

  var firstVoronoiByInterComm = []

  var cachedLayers = {} //placehoder for the layers, to compute them only once

  /**
   * Loads, pre-processes and caches the layer with the given path.
   * This includes:
   * - Fetching the layer's JSON data;
   * - Fetching containment files.
   * - Preparing arrays for means, counts and histograms.
   * - Dispatching those computations to worker threads.
   */
  function loadLayer(path, colors, callback) {
    if (cachedLayers[path]) {
      callback();
      return;
    }
    var color_low = colors[0]
    var color_high = colors[1]

    fetch(path)
      .then(res => res.json())
      .then(json => {
        json.data = JSON.parse(json.data)

        var pixels = json.data;

        canvas.width = json.width
        canvas.height = json.height

        var tempContext = canvas.getContext("2d");
        tempContext.createImageData(canvas.width, canvas.height);

        var len = canvas.height * canvas.width;
        var workersCount = 1;
        var finished = 0;
        var segmentLength = len / workersCount;
        var blockSize = canvas.height / workersCount;

        //initalize means and counts arrays
        var voronoi_means = []
        var voronoi_counts = []
        var voronoi_hist = {}

        for (var i = 0; i < voronoi_shape.features.length; ++i) {
          voronoi_counts[i] = 0
          voronoi_means[i] = 0
          voronoi_hist[i] = []
        }

        var interComm_means = []
        var interComm_counts = []
        var interComm_hist = {}

        for (var i = 0; i < interComm_shape.features.length; ++i) {
          interComm_counts[i] = 0
          interComm_means[i] = 0
          interComm_hist[i] = []
        }

        firstVoronoiByInterComm = []
        for (var i = 0; i < interComm_shape.features.length; ++i) {
          firstVoronoiByInterComm[i] = 10000 //bigger than the max, ~670
        }

        // Return a promise.
        var onWorkEnded = function(e) {
          var canvasData = e.data.result;
          var index = e.data.index;

          var interComm_counts_portion = e.data.interComm_counts
          var interComm_means_portion = e.data.interComm_means
          var voronoi_counts_portion = e.data.voronoi_counts
          var voronoi_means_portion = e.data.voronoi_means
          var firstVoronoiByInterCommPortion = e.data.firstVoronoiByInterComm
          var voronoi_hist_portion = e.data.voronoi_hist
          var interComm_hist_portion = e.data.interComm_hist

          for (var i = 0; i < voronoi_shape.features.length; ++i) {
            voronoi_counts[i] += voronoi_counts_portion[i]
            voronoi_means[i] += voronoi_means_portion[i]
            voronoi_hist[i] = voronoi_hist[i].concat(voronoi_hist_portion[i])
          }

          for (var i = 0; i < interComm_shape.features.length; ++i) {
            interComm_counts[i] += interComm_counts_portion[i]
            interComm_means[i] += interComm_means_portion[i]
            interComm_hist[i] = interComm_hist[i].concat(interComm_hist_portion[i])

            if (firstVoronoiByInterComm[i] > firstVoronoiByInterCommPortion[i]) {
              firstVoronoiByInterComm[i] = firstVoronoiByInterCommPortion[i]
            }
          }

          tempContext.putImageData(canvasData, 0, blockSize * index);
          finished++;

          if (finished == workersCount) {
              if(path == Config.Ecole_path){
                  // Here we count the number of schools
                    for (var i = 0; i < voronoi_shape.features.length; ++i) {
                        voronoi_means[i] /= 255
                    }
                    for (var i = 0; i < interComm_shape.features.length; ++i) {
                        interComm_means[i] /= 255
                    }
                }
              else{
                    for (var i = 0; i < voronoi_shape.features.length; ++i) {
                      if (voronoi_counts[i] != 0) {
                        voronoi_means[i] /= voronoi_counts[i]
                      }
                    }
                    for (var i = 0; i < interComm_shape.features.length; ++i) {
                      if (interComm_counts[i] != 0) {
                        interComm_means[i] /= interComm_counts[i]
                      }
                    }
                }
                
            var hist_buckets = [70, 140]; //TODO: change acodring to layer (hard-coded...)

            var value = canvas.toDataURL("png");
            imgs.attr("xlink:href", value)
            
            cachedLayers[path] = {
              "url": value,
              "tl_lat": json.tl_lat,
              "tl_lng": json.tl_lng,
              "br_lat": json.br_lat,
              "br_lng": json.br_lng,
              "width": canvas.width,
              "height": canvas.height,
              "voronoi_means": voronoi_means,
              "interComm_means": interComm_means,
              "voronoi_hist": voronoi_hist,
              "interComm_hist": interComm_hist,
              "hist_buckets": hist_buckets,
              "layerUrl": path
            }

            callback();
          }
        };

        // FIXME(liautaud): Nested callbacks is a code smell.
        // FIXME(liautaud): This should be done only once.
        loadContainmentFile("data/voronoi_cont.json").then(voronoiContainment => {
          loadContainmentFile("data/intercomm_cont.json").then(interCommContainment => {
            for (var index = 0; index < workersCount; index++) {
              var worker = new Worker("assets/pictureProcessor.js");
              worker.onmessage = onWorkEnded;
              var canvasData = tempContext.getImageData(0, blockSize * index, canvas.width, blockSize);
              worker.postMessage({
                canvasData: canvasData,
                pixels: pixels,
                index: index,
                length: segmentLength,
                width: canvas.width,
                height: canvas.height,
                voronoiContainmentData: voronoiContainment.data,
                interCommContainmentData: interCommContainment.data,
                numVoronois: voronoi_shape.features.length,
                numInterComms: interComm_shape.features.length,
                tl_lat: json.tl_lat,
                tl_lng: json.tl_lng,
                br_lat: json.br_lat,
                br_lng: json.br_lng,
                percentiles: json.percentiles,
                color_low : color_low,
                color_hiegh : color_high
              });
            }
          })
        })
      })

    // TODO(liautaud): Return a Promise.
  }

  function setEVLayer(path){
    imgs_EV.attr("xlink:href", cachedLayers[Config.EV_path].url)
  }
  
  /**
   * Changes the current layer to the one with a given path.
   */
  function setLayer(path, colors) {
    if (!path) {
      update_parameters.hide = true
      update()
      return;
    }

    loadLayer(path,colors,() => {
      // Once the layer is loaded, we can get it from the cache.
      const layer = cachedLayers[path]

      console.log(colors)
      // Use d3 color scales to map values to fill colors.
      const colorScale = d3.scale.linear()
        .range(colors)

      //console.log(cachedLayers[path].percentiles)
      var min = 0//Math.min(...layer.voronoi_means)
      var max = 255//Math.max(...layer.voronoi_means)

      /*var domain = []
      var uniform_range = []
      for (var i=0; i<colors.length;++i){
        domain.push(i / (colors.length-1))
      }
      const linearScale = colorScale.domain(uniform_range)*/

      var domain = []
      for (var i=0; i<colors.length;++i){
        domain.push( i * max / (colors.length-1) + (colors.length-1 - i) * min / (colors.length-1))
      }
      const voronoiScale = colorScale
        .domain(domain)

      voronoi.attr('fill', (_, i) =>
        voronoiScale(layer.voronoi_means[i]))

      min = 0//Math.min(...layer.interComm_means)
      max = 255//Math.max(...layer.interComm_means)

      domain = []
      for (var i=0; i<colors.length;++i){
        domain.push( i * max / (colors.length-1) + (colors.length-1 - i) * min / (colors.length-1))
      }
      //console.log(domain)
      //console.log(Math.min(...layer.interComm_means),Math.max(...layer.interComm_means))
      const intercommScale = colorScale
        .domain(domain)
      interComms.attr('fill', (_, i) =>{
        console.log(layer.interComm_means[i],intercommScale(layer.interComm_means[i]));
        return intercommScale(layer.interComm_means[i])})

      /*console.log(domain)
      console.log(intercommScale(min))
      console.log(intercommScale(min/2 + max/2))
      console.log(intercommScale(max))*/

      // Reset the width and height of the canvas.
      canvas.width = layer.width
      canvas.height = layer.height

      // Update the bounding box and current coordinates.
      update_parameters.hide = false
      update_parameters.tl = new L.LatLng(layer.tl_lat, layer.tl_lng)
      update_parameters.br = new L.LatLng(layer.br_lat, layer.br_lng)
      update_parameters.current_geoLat = current_geoLat
      update_parameters.current_geoLong = current_geoLong

      update()
      currentLayerPath = path
      imgs.attr('xlink:href', layer.url)
    })
  }

  return [loadLayer, setLayer, setLocation, setEVLayer]
}