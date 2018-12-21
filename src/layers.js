var Config = require('./config.json')
import helpers_f from './helpers.js'
import shared from './shared.js'
import update_f from './update.js'


/**
 * Loads, pre-processes and caches the layer with the given path.
 * This includes:
 * - Fetching the layer's JSON data;
 * - Fetching containment files.
 * - Preparing arrays for means, counts and histograms.
 * - Dispatching those computations to worker threads.
 */
function loadLayer(path, isFuture, callback) {
  var canvas = shared.canvas
  var voronoi_shape = shared.voronoi_shape
  var interComm_shape = shared.interComm_shape
  if (shared.cachedLayers[path]) {
    callback();
    return;
  }

  let truePath = path
  if (isFuture) {
    truePath = Config.layers[path].future
  }

  fetch(truePath)
    .then(res => res.json())
    .then(json => {
      console.log('Preloaded layer:', truePath)
      
      json.data = JSON.parse(json.data)
      json.percentiles = JSON.parse(json.percentiles)

      var pixels = json.data;

      canvas.width = json.width
      canvas.height = json.height

      var tempContext = canvas.getContext("2d");
      tempContext.createImageData(canvas.width, canvas.height);

      //initalize means and counts arrays
      var entire_hist = []


      for (var i=0; i<256; ++i){
        entire_hist[i] = 0
      }

      shared.firstVoronoiByInterComm = []
      // Return a promise.
      var onWorkEnded = function(e) {
        var canvasData = e.data.result;

        var interComm_counts = e.data.interComm_counts
        var interComm_means = e.data.interComm_means
        var voronoi_counts = e.data.voronoi_counts
        var voronoi_means = e.data.voronoi_means
        shared.firstVoronoiByInterComm = e.data.firstVoronoiByInterComm
        var voronoi_hist = e.data.voronoi_hist
        var interComm_hist = e.data.interComm_hist

        for (var i = 0; i < interComm_shape.features.length; ++i) {
          for (var j=0; j<256; ++j){
            entire_hist[j] += interComm_hist[i][j]
          }
        }

        tempContext.putImageData(canvasData, 0, 0);

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
            
        var hist_buckets = [70, 140];

        var value = canvas.toDataURL("png");

        update_f.updateCirclePreviewLayer()//refresh the EV overlay, the layer we want might be ready now

        var colorScale = null
        if (Config.layers[path] && Config.layers[path].useColorScheme){
          var domain = helpers_f.range(256)
          var range = helpers_f.getColorsFromScheme(Config.layers[path].colorScheme)
        
          colorScale = d3.scale.linear()
            .range(range).domain(domain)
        }
        
        if (Config.layers[path] && Config.layers[path].useColorScheme){
          range = helpers_f.getColorsFromScheme(Config.layers[path].colorScheme)
        }
        
        shared.cachedLayers[truePath] = {
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
          "entire_hist":entire_hist,
          "interComm_hist": interComm_hist,
          "hist_buckets": hist_buckets,
          "percentiles" : json.percentiles,
          "layerUrl": truePath,
          "colorScale": colorScale
        }

        console.log('Processed layer:', truePath)

        callback();
        
      };

      // FIXME(liautaud): Nested callbacks is a code smell.

      var domain = helpers_f.range(256)
      var range = []
      if (Config.layers[path] && Config.layers[path].useColorScheme){
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

      var worker = new Worker("assets/pictureProcessor.js");
      worker.onmessage = onWorkEnded;
      var canvasData = tempContext.getImageData(0, 0, canvas.width, canvas.height);
      worker.postMessage({
        canvasData: canvasData,
        pixels: pixels,
        length: canvas.height * canvas.width,
        width: canvas.width,
        height: canvas.height,
        voronoiContainmentData: shared.voronoiContainment.data,
        interCommContainmentData: shared.interCommContainment.data,
        numVoronois: voronoi_shape.features.length,
        numInterComms: interComm_shape.features.length,
        tl_lat: json.tl_lat,
        tl_lng: json.tl_lng,
        br_lat: json.br_lat,
        br_lng: json.br_lng,
        colorDomain: domain,
        colorRange: range
      });
    })

  // TODO(liautaud): Return a Promise.
}


/**
 * Changes the current layer to the one with a given path.
 */
function setLayer(layerPath, isFuture) {
  var update_parameters = shared.update_parameters
  var imgs = shared.imgs

  if (!layerPath) {
    update_parameters.hide = true
    update_f.updateMap()
    return;
  }

  let truePath = layerPath
  if (isFuture) {
    truePath = Config.layers[layerPath].future
  }

  this.loadLayer(layerPath, isFuture, () => {

  if (layerPath == Config.EV_path){
      imgs.attr("clip-path", "")
    }
    else{
      imgs.attr("clip-path", "url(#clip)")
    }

    // Once the layer is loaded, we can get it from the cache.
    const layer = shared.cachedLayers[truePath]

    update_parameters.tl = new L.LatLng(layer.tl_lat, layer.tl_lng)
    update_parameters.br = new L.LatLng(layer.br_lat, layer.br_lng)
    update_parameters.currentGeoLat = shared.currentGeoLat
    update_parameters.currentGaoLng = shared.currentGeoLng

    var min = 0
    var max = 255

    var domain = []
    var range = []
    if (Config.layers[layerPath].useColorScheme){
      domain = helpers_f.range(256)
      range = helpers_f.getColorsFromScheme(Config.layers[layerPath].colorScheme,Config.layers[layerPath].invertColorScheme)
    }
    else{
      var domain_range =helpers_f.computeColorRange(layer.percentiles,Config.layers[layerPath].colors)
      domain = domain_range[0]
      range = domain_range[1]
    }


    

    const colorScale = layer.colorScale
    shared.voronoi.style('fill', function(_, i){
      if (layerPath == Config.EV_path){
        return "#00000011" //transparent
      }
      return colorScale(layer.voronoi_means[i])})

    min = 0//Math.min(...layer.interComm_means)
    max = 255//Math.max(...layer.interComm_means)
      


    // Reset the width and height of the canvas.
    shared.canvas.width = layer.width
    shared.canvas.height = layer.height

    // Update the bounding box and current coordinates.
    update_parameters.hide = false

    update_f.updateMap()

    shared.interComms.style('fill', function(_, i){
      if (shared.highlightedInterComm != -1) { // i.e. we are zoomed in
        if (i != shared.highlightedInterComm) {
            return "#000"
          
        } else {
          //should never happen
        }
      } else { // we are not zoomed in
        if (!Config.layers[layerPath].useColorScheme){
          return "#00000011"
        }
        return colorScale(layer.interComm_means[i])
      }
    })

    shared.currentLayerPath = layerPath
    imgs.attr('xlink:href', layer.url)

    d3.select(shared.legend_element).style("display","none")

    if (layerPath != Config.EV_path){
      d3.select(shared.legend_element).style("display","block")
      helpers_f.fillScale(shared.color_legend_canvas,shared.color_legend_svg,colorScale,Config.layers[layerPath].min_value,Config.layers[layerPath].max_value,Config.layers[layerPath].invertColorScheme)
    }
  })

  shared.isFuture = isFuture

  update_f.updateCirclePreviewLayer()

  update_f.update_chart(shared.currentLayerPath)
  update_f.update_text_school(shared.currentLayerPath)

  update_f.update_EV_preview(shared.lastMousePosition.x,shared.lastMousePosition.y)
}

function setEVLayer(path){
  shared.imgs_EV.attr("xlink:href", shared.cachedLayers[Config.EV_path].url)
}

export default {loadLayer,setLayer,setEVLayer}