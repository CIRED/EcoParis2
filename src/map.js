import Config from './config.json'

var helpers_f = require("./helpers.js")
var update_f = require("./update.js")
var shared = require("./shared.js")

export default function(element, EV_svg_element, EV_circle_svg_element, legend_element, error, interComm_shape, voronoi_shape, onHistChange, onSchools) {
  const default_tl = new L.LatLng(
    Config.viewport.topLatitude,
    Config.viewport.leftLongitude
  )
  const default_br = new L.LatLng(
    Config.viewport.bottomLatitude,
    Config.viewport.rightLongitude
  )
  const initialBounds = L.latLngBounds(default_tl, default_br)

  var color_legend_canvas = d3.select(legend_element)
    .append("canvas")

  var color_legend_svg = d3.select(legend_element)
    .append("svg")
  color_legend_svg.append("g")

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

    shared.currentGeoLat = lat
    shared.currentGeoLng = lng
    update_f.updateMarker(markerElement)
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

  helpers_f.createMap(element, initialBounds) //TODO: if the window is small, the zoom is too far (> 14) and the map is grey, untill we zoom in
  var map = shared.map

  L.geoJson(interComm_shape, {
    style: helpers_f.blankStyle
  }).addTo(map); //needed! otherwise a svg isn't generated, we use this one for practical purposes

  var svg = d3.select(element).select(".leaflet-zoom-animated")

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
    .attr("clip-path", "")

  update_f.update_clip(defs_path)


  var emptyOpacity = 0
  var fadedOpacity = 0.4
  var semiFullOpacity = 0.7
  var fullOpacity = 1

  var svg_EV = d3.select(EV_svg_element)
    .attr("style","display:none;")
  var svg_circle_EV = d3.select(EV_circle_svg_element)
    .attr("style","display:none;")

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
      update_f.update_clip(defs_path)
      update_f.update_chart(i, true, onHistChange)
      update_f.update_text_school(i, shared.currentLayerPath, false, onSchools)
    })
    .on("mouseout", function(d, i) {
      if (highlightedInterComm != -1) {
        d3.select(this).style('fill-opacity', oneIfInInterComm(highlightedInterComm)(d, i));
        d3.select(this).style('stroke-opacity', oneIfInInterComm(highlightedInterComm)(d, i));
      }

      defs_path.datum([])
      update_f.update_clip(defs_path)
      svg_EV.attr("style","display:none;")
      svg_circle_EV.attr("style","display:none;")
    })
    .on("click", function(d, i) {
      interComms.style("pointer-events", "all")
      map.fitBounds(initialBounds) // zoom back to paris
      highlightedInterComm = -1
      interComms.style("fill-opacity", fullOpacity)
      voronoi.style("fill-opacity", emptyOpacity)
      voronoi.style("stroke-opacity", emptyOpacity)

      defs_path.datum([])
      update_f.update_clip(defs_path)
      svg_EV.attr("style","display:none;")
      svg_circle_EV.attr("style","display:none;")
    })
    .on("mousemove",function(){
      if (d3.event && d3.event.clientX && d3.event.clientY && shared.currentLayerPath != Config.EV_path){
        update_f.update_EV_preview(d3.event.layerX,d3.event.layerY,svg_EV,svg_circle_EV,imgs_EV)
      }
      else{
        svg_EV.attr("style","display:none;")
        svg_circle_EV.attr("style","display:none;")
      }
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
      update_f.update_chart(i, true, onHistChange)
      update_f.update_text_school(i, shared.currentLayerPath, false, onSchools)
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
      svg_EV.attr("style","display:none;")
      svg_circle_EV.attr("style","display:none;")
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
      svg_EV.attr("style","display:none;")
      svg_circle_EV.attr("style","display:none;")
    })
    .on("mousemove",function(){
      if (d3.event && d3.event.clientX && d3.event.clientY && shared.currentLayerPath != Config.EV_path){
        //console.log(d3.event)
        update_f.update_EV_preview(d3.event.layerX,d3.event.layerY,svg_EV,svg_circle_EV,imgs_EV)
      }
      else{
        svg_EV.attr("style","display:none;")
        svg_circle_EV.attr("style","display:none;")
      }
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


  map.on('viewreset', function(){update_f.updateMap(update_parameters,interComms,voronoi,imgs,imgs_EV,svg_EV,svg_circle_EV,markerElement,path,defs_path)})

  var firstVoronoiByInterComm = []

  var cachedLayers = shared.cachedLayers //placehoder for the layers, to compute them only once

  /**
   * Loads, pre-processes and caches the layer with the given path.
   * This includes:
   * - Fetching the layer's JSON data;
   * - Fetching containment files.
   * - Preparing arrays for means, counts and histograms.
   * - Dispatching those computations to worker threads.
   */
  function loadLayer(path, callback) {
    if (shared.cachedLayers[path]) {
      callback();
      return;
    }

    fetch(path)
      .then(res => res.json())
      .then(json => {
        json.data = JSON.parse(json.data)
        json.percentiles = JSON.parse(json.percentiles)

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
          for (var j=0; j<256; ++j){
            voronoi_hist[i][j]=0
          }
        }

        var interComm_means = []
        var interComm_counts = []
        var interComm_hist = {}

        for (var i = 0; i < interComm_shape.features.length; ++i) {
          interComm_counts[i] = 0
          interComm_means[i] = 0
          interComm_hist[i] = []
          for (var j=0; j<256; ++j){
            interComm_hist[i][j]=0
          }
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

            for (var j=0; j<256; ++j){
              voronoi_hist[i][j] += voronoi_hist_portion[i][j]
            }
          }

          for (var i = 0; i < interComm_shape.features.length; ++i) {
            interComm_counts[i] += interComm_counts_portion[i]
            interComm_means[i] += interComm_means_portion[i]

            for (var j=0; j<256; ++j){
              interComm_hist[i][j] += interComm_hist_portion[i][j]
            }
            

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
            //imgs.attr("xlink:href", value)
            
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
              "percentiles" : json.percentiles,
              "layerUrl": path
            }

            callback();
          }
        };

        // FIXME(liautaud): Nested callbacks is a code smell.
        // FIXME(liautaud): This should be done only once.

        var domain = [...Array(256).keys()]
        var range = []
        if (Config.layers[path].useColorScheme){
          range = helpers_f.getColorsFromScheme(Config.layers[path].colorScheme)
        }
        else{
          var domain_range = helpers_f.computeColorRange(json.percentiles,Config.layers[path].colors)
          var domain_continuous = domain_range[0]
          var range_continuous = domain_range[1]
          const colorScale = d3.scale.linear()
            .range(range_continuous).domain(domain_continuous)

          for (var i=0; i<256; ++i){
            var color = d3.rgb(colorScale(i))
            range.push("rgb("+color.r+","+color.g+","+color.b+")")
          }
        }

        helpers_f.loadContainmentFile("data/voronoi_cont.json").then(voronoiContainment => {
          helpers_f.loadContainmentFile("data/intercomm_cont.json").then(interCommContainment => {
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
                colorDomain: domain,
                colorRange: range
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
  function setLayer(layerPath) {
    if (!layerPath) {
      update_parameters.hide = true
      update_f.updateMap(update_parameters,interComms,voronoi,imgs,imgs_EV,svg_EV,svg_circle_EV,markerElement,path,defs_path)
      return;
    }

    loadLayer(layerPath,() => {
      if (layerPath == Config.EV_path){ //TODO: add parameter "AlwaysShowLayer" in config?
        imgs.attr("clip-path", "")
      }
      else{
        imgs.attr("clip-path", "url(#clip)")
      }
      // Once the layer is loaded, we can get it from the cache.
      const layer = cachedLayers[layerPath]

      update_parameters.tl = new L.LatLng(layer.tl_lat, layer.tl_lng)
      update_parameters.br = new L.LatLng(layer.br_lat, layer.br_lng)
      update_parameters.currentGeoLat = shared.currentGeoLat
      update_parameters.currentGaoLng = shared.currentGeoLng

      var min = 0
      var max = 255

      

      var domain = []
      var range = []
      if (Config.layers[layerPath].useColorScheme){
        domain = [...Array(256).keys()]
        range = helpers_f.getColorsFromScheme(Config.layers[layerPath].colorScheme)
      }
      else{
        var domain_range =helpers_f.computeColorRange(layer.percentiles,Config.layers[layerPath].colors)
        domain = domain_range[0]
        range = domain_range[1]
      }


      

      const colorScale = d3.scale.linear()
        .range(range).domain(domain)
      voronoi.attr('fill', (_, i) =>{
        //console.log(layer.voronoi_means[i],colorScale(layer.voronoi_means[i]))
        if (layerPath == Config.EV_path){
          return "#00000011" //transparent
        }
        return colorScale(layer.voronoi_means[i])})

      min = 0//Math.min(...layer.interComm_means)
      max = 255//Math.max(...layer.interComm_means)

      interComms.attr('fill', (_, i) =>{
        //console.log(layer.interComm_means[i],colorScale(layer.interComm_means[i]))
        if (layerPath == Config.EV_path){
          return "#00000011" //transparent
        }
        return colorScale(layer.interComm_means[i])})


      // Reset the width and height of the canvas.
      canvas.width = layer.width
      canvas.height = layer.height

      // Update the bounding box and current coordinates.
      update_parameters.hide = false

      update_f.updateMap(update_parameters,interComms,voronoi,imgs,imgs_EV,svg_EV,svg_circle_EV,markerElement,path,defs_path)
      shared.currentLayerPath = layerPath
      imgs.attr('xlink:href', layer.url)

      if (layerPath == Config.EV_path){
        //TODO: show color legend, but discrete!
        d3.select(legend_element).style("display","none")
          .style("border", "1px solid #0000")
      }
      else{
        helpers_f.fillScale(color_legend_canvas,color_legend_svg,colorScale,Config.layers[layerPath].min_value,Config.layers[layerPath].max_value)
        d3.select(legend_element).style("background-color","#fff")
        d3.select(legend_element).style("display","")
          .style("border", "1px solid #000")
      }
      
    })
  }

  return [loadLayer, setLayer, setLocation, setEVLayer]
}