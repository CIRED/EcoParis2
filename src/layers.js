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

      shared.firstVoronoiByInterComm = []
      var firstVoronoiByInterComm = shared.firstVoronoiByInterComm

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
            "interComm_hist": interComm_hist,
            "hist_buckets": hist_buckets,
            "percentiles" : json.percentiles,
            "layerUrl": truePath
          }

          console.log('Processed layer:', truePath)

          callback();
        }
      };

      // FIXME(liautaud): Nested callbacks is a code smell.
      // FIXME(liautaud): This should be done only once.

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

      //helpers_f.loadContainmentFile("data/voronoi_cont.json").then(voronoiContainment => {
      //  helpers_f.loadContainmentFile("data/intercomm_cont.json").then(interCommContainment => {
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
          }
        //})
      //})
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
  if (layerPath == Config.EV_path){ //TODO: add parameter "AlwaysShowLayer" in config?
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
      range = helpers_f.getColorsFromScheme(Config.layers[layerPath].colorScheme)
    }
    else{
      var domain_range =helpers_f.computeColorRange(layer.percentiles,Config.layers[layerPath].colors)
      domain = domain_range[0]
      range = domain_range[1]
    }


    

    const colorScale = d3.scale.linear()
      .range(range).domain(domain)
    shared.voronoi.attr('fill', (_, i) =>{
      //console.log(layer.voronoi_means[i],colorScale(layer.voronoi_means[i]))
      if (layerPath == Config.EV_path){
        return "#00000011" //transparent
      }
      return colorScale(layer.voronoi_means[i])})

    min = 0//Math.min(...layer.interComm_means)
    max = 255//Math.max(...layer.interComm_means)

    shared.interComms.attr('fill', (_, i) =>{
      //console.log(layer.interComm_means[i],colorScale(layer.interComm_means[i]))
      if (layerPath == Config.EV_path){
        return "#00000011" //transparent
      }
      return colorScale(layer.interComm_means[i])})


    // Reset the width and height of the canvas.
    shared.canvas.width = layer.width
    shared.canvas.height = layer.height

    // Update the bounding box and current coordinates.
    update_parameters.hide = false

    update_f.updateMap()
    shared.currentLayerPath = layerPath
    imgs.attr('xlink:href', layer.url)

    d3.select(shared.legend_element).style("display","none")

    if (layerPath != Config.EV_path){
      d3.select(shared.legend_element).style("display","block")
      helpers_f.fillScale(shared.color_legend_canvas,shared.color_legend_svg,colorScale,Config.layers[layerPath].min_value,Config.layers[layerPath].max_value)
    }
  })
}

function setEVLayer(path){
  shared.imgs_EV.attr("xlink:href", shared.cachedLayers[Config.EV_path].url)
}

export default {loadLayer,setLayer,setEVLayer}