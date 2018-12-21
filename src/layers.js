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
  if (shared.cachedLayers[path]) { //if the layer is already loaded, call callback and stop here
    callback();
    return;
  }

  let truePath = path
  if (isFuture) {
    truePath = Config.layers[path].future //true path is the path of the future layer, if needed
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
      tempContext.createImageData(canvas.width, canvas.height); //get the container of pixels color data

      //initalize the histogram of the entire Paris region
      var entire_hist = []

      for (var i=0; i<256; ++i){
        entire_hist[i] = 0
      }

      shared.firstVoronoiByInterComm = []

      //this function will be used as a callback once the worker has finished its job
      var onWorkEnded = function(e) {
        //get results from message
        var canvasData = e.data.result;

        var interComm_counts = e.data.interComm_counts
        var interComm_means = e.data.interComm_means
        var voronoi_counts = e.data.voronoi_counts
        var voronoi_means = e.data.voronoi_means
        shared.firstVoronoiByInterComm = e.data.firstVoronoiByInterComm
        var voronoi_hist = e.data.voronoi_hist
        var interComm_hist = e.data.interComm_hist

        //fill the histogram of the entire Paris region
        for (var i = 0; i < interComm_shape.features.length; ++i) {
          for (var j=0; j<256; ++j){
            entire_hist[j] += interComm_hist[i][j]
          }
        }

        tempContext.putImageData(canvasData, 0, 0); //fill the content of the image

        if(path == Config.Ecole_path){ 
          // Here we count the number of schools, for this particular layer
            for (var i = 0; i < voronoi_shape.features.length; ++i) {
                voronoi_means[i] /= 255 //each white pixel (255) is a school, so total value / 255 == number of schools
            }
            for (var i = 0; i < interComm_shape.features.length; ++i) {
                interComm_means[i] /= 255 //each white pixel (255) is a school, so total value / 255 == number of schools
            }
        }
        else{ //any non-school layer

          for (var i = 0; i < voronoi_shape.features.length; ++i) {
            if (voronoi_counts[i] != 0) {
              voronoi_means[i] /= voronoi_counts[i] //divide the total sum (currently "mean") by the total number of points in this area
            }
          }
          for (var i = 0; i < interComm_shape.features.length; ++i) {
            if (interComm_counts[i] != 0) {
              interComm_means[i] /= interComm_counts[i] //divide the total sum (currently "mean") by the total number of points in this area
            }
          }
        }
          
        var value = canvas.toDataURL("png"); //save the image content

        update_f.updateCirclePreviewLayer()//refresh the EV overlay, the layer we want might be ready now

        var colorScale = null
        if (Config.layers[path] && Config.layers[path].useColorScheme){ //if the exists and uses a color scale
          var domain = helpers_f.range(256)
          var range = helpers_f.getColorsFromScheme(Config.layers[path].colorScheme) //get the discrete color range, to be able to simply store it without recomputing it
        
          colorScale = d3.scale.linear()
            .range(range).domain(domain)
        }
        
        //save every information about this layer in our cachedLayery dict, for later re-use
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
          "percentiles" : json.percentiles,
          "layerUrl": truePath,
          "colorScale": colorScale
        }

        console.log('Processed layer:', truePath)

        //finally, we are done, call callback
        callback();
        
      };

      //define the range and domain of the color scale
      var domain = helpers_f.range(256)
      var range = []
      if (Config.layers[path] && Config.layers[path].useColorScheme){ //if the layer uses a predefined color scale, fine, simply use it!
        range = helpers_f.getColorsFromScheme(Config.layers[path].colorScheme) //but convert it to a discrete verions first, the workers don't have access to d3! ==> give them the domain/range arrays
      }
      else{ //else, compute manually the domain and range, from an array of given colors
        var domain_range = helpers_f.computeColorRange(json.percentiles,Config.layers[path].colors)
        var domain_continuous = domain_range[0]
        var range_continuous = domain_range[1]
        const colorScale = d3.scale.linear()
          .range(range_continuous).domain(domain_continuous)

        for (var i=0; i<256; ++i){ //save each color in the array
          var color = d3.rgb(colorScale(i))
          range.push("rgb("+color.r+","+color.g+","+color.b+")")
        }
      }

      var worker = new Worker("assets/pictureProcessor.js"); //spawn a worker
      worker.onmessage = onWorkEnded; //setup the callback function

      var canvasData = tempContext.getImageData(0, 0, canvas.width, canvas.height); //prepare the canvas

      //and finally make it start working!
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
}


/**
 * Changes the current layer to the one with a given path.
 */
function setLayer(layerPath, isFuture) {
  var update_parameters = shared.update_parameters
  var imgs = shared.imgs

  if (!layerPath) { // if no layer is given, hide the map
    update_parameters.hide = true
    update_f.updateMap()
    return;
  }

  let truePath = layerPath
  if (isFuture) {
    truePath = Config.layers[layerPath].future //true path is the path of the future layer, if needed
  }

  this.loadLayer(layerPath, isFuture, () => { //first, load the layer (if it is already loaded, callback will immediatly be called)

    if (layerPath == Config.EV_path){
      imgs.attr("clip-path", "")
    }
    else{
      imgs.attr("clip-path", "url(#clip)")
    }

    // Once the layer is loaded, we can get it from the cache.
    const layer = shared.cachedLayers[truePath]

    //get the corners positions of the image, and our current position
    update_parameters.tl = new L.LatLng(layer.tl_lat, layer.tl_lng)
    update_parameters.br = new L.LatLng(layer.br_lat, layer.br_lng)
    update_parameters.currentGeoLat = shared.currentGeoLat
    update_parameters.currentGaoLng = shared.currentGeoLng

    var min = 0
    var max = 255

    var domain = []
    var range = []
    if (Config.layers[layerPath].useColorScheme){ //if the layer uses a colorScheme, simply use it
      domain = helpers_f.range(256)
      range = helpers_f.getColorsFromScheme(Config.layers[layerPath].colorScheme,Config.layers[layerPath].invertColorScheme)
    }
    else{ //else manually compute it from the given colors and percentiles
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

    //redraw the map, the layer has changed
    update_f.updateMap()

    shared.interComms.style('fill', function(_, i){ //update the colors of the intercomms
      if (shared.highlightedInterComm != -1) { // i.e. we are zoomed in,
        if (i != shared.highlightedInterComm) { //we are not focused on this intercomm, use a grey (dark transparent) color
            return "#000"
          
        } else {
          //nothing to do, it is not displayed anyway
        }
      } else { // we are not zoomed in
        if (!Config.layers[layerPath].useColorScheme){ //if this layer doesn't use a colorScheme, put a transparent slight grey color
          return "#00000011"
        }
        return colorScale(layer.interComm_means[i]) //else use its color scale
      }
    })

    shared.currentLayerPath = layerPath //update current path 
    imgs.attr('xlink:href', layer.url) //update the displayed layer image

    d3.select(shared.legend_element).style("display","none") //hide the legend

    if (layerPath != Config.EV_path){ //and display it back if we should
      d3.select(shared.legend_element).style("display","block")
      helpers_f.fillScale(shared.color_legend_canvas,shared.color_legend_svg,colorScale,Config.layers[layerPath].min_value,Config.layers[layerPath].max_value,Config.layers[layerPath].invertColorScheme)
    }
  })

  shared.isFuture = isFuture //update the current state (in the future or not)


  //update the sidebar informations
  update_f.update_chart(shared.currentLayerPath)
  update_f.update_text_school(shared.currentLayerPath)


  update_f.updateCirclePreviewLayer() // update the path of the layer that shouly be displayed in the circle
  update_f.updateCirclePreview(shared.lastMousePosition.x,shared.lastMousePosition.y) //and then update the circle preview
}


/**
 * Sets the image of the espaces_verts layer
 */
function setEVLayer(){
  shared.imgs_EV.attr("xlink:href", shared.cachedLayers[Config.EV_path].url)
}

export default {loadLayer,setLayer,setEVLayer}