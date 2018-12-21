var Config = require('./config.json')
import helpers_f from './helpers.js'
import shared from './shared.js'

/**
 * Update the clip of the current layer, i.e. if we are hovering a voronoi, only show data inside this voronoi
 */
function update_clip() {
  var map = shared.map
  var cachedLayers = shared.cachedLayers
  var currentLayerPath = shared.currentLayerPath
  var defs_path = shared.defs_path

  //project point from lat lng to svg coordinate
  function clip_projectPoint(x, y) {

    if (!cachedLayers[currentLayerPath]){ //layer not loaded, don't do anything yet
      return
    }
    //top-left and bottom-right positions of the current layer, in pixels
    var default_tl_point = map.latLngToLayerPoint([cachedLayers[currentLayerPath].tl_lat, cachedLayers[currentLayerPath].tl_lng])
    var default_br_point = map.latLngToLayerPoint([cachedLayers[currentLayerPath].br_lat, cachedLayers[currentLayerPath].br_lng])

    var width = (default_br_point.x - default_tl_point.x)
    var height = (default_br_point.y - default_tl_point.y)

    //convert our point to pixel coordinates
    var point = map.latLngToLayerPoint(L.latLng(y, x))

    //percentage inside the image
    var tx = (point.x - default_tl_point.x) / (default_br_point.x - default_tl_point.x)
    var ty = (point.y - default_tl_point.y) / (default_br_point.y - default_tl_point.y)

    this.stream.point(tx * (width - 1), ty * (height - 1));
  }

  var clip_transform = d3.geo.transform({
    point: clip_projectPoint
  });
  var clip_path = d3.geo.path()
    .projection(clip_transform);
  defs_path.attr("d", clip_path)
}

/**
 * Update the preview of the circle overlay, given mouse position
 */
function updateCirclePreview(mouseX,mouseY){
  updateCirclePreviewPath()
  var svg_EV = shared.svg_EV
  var svg_circle_EV = shared.svg_circle_EV
  var map = shared.map
  var cachedLayers = shared.cachedLayers
  var imgs_EV = shared.imgs_EV

  var layer_path = shared.currentCircleLayerPath
  if (!cachedLayers[layer_path] || !shared.showCirclePreview){ //if the layer is not loaded, don't display any circle
    shared.svg_EV.style("display","none")
    shared.svg_circle_EV.style("display","none")
    return
  }

  //get svg widths, from elements containing the circles
  var svg_width = parseInt(svg_EV.style("width").substr(0,svg_EV.style("width").length-2))
  var svg_height = parseInt(svg_EV.style("height").substr(0,svg_EV.style("width").length-2))
  var svg_circle_width = parseInt(svg_circle_EV.style("width").substr(0,svg_circle_EV.style("width").length-2))
  var svg_circle_height = parseInt(svg_circle_EV.style("height").substr(0,svg_circle_EV.style("width").length-2))

  //move the previw to the top-right of the current mose position
  svg_EV.style("top",(mouseY - svg_height - 15)+"px")
  svg_EV.style("left",(mouseX + 15)+"px")
  svg_EV.style("display","")

  //move the circle around mouse
  svg_circle_EV.style("top",(mouseY - svg_circle_height/2)+"px")
  svg_circle_EV.style("left",(mouseX - svg_circle_width/2)+"px")
  svg_circle_EV.style("display","")

  //magnifying ration, ration bubble (contains the image) size / circle around the mouse size
  var magnifyingRatio = svg_width/svg_circle_width

  //get top-left and bottom-right position of the current layer, in lat lng
  var tl = L.latLng(cachedLayers[layer_path].tl_lat,cachedLayers[layer_path].tl_lng)
  var br = L.latLng(cachedLayers[layer_path].br_lat,cachedLayers[layer_path].br_lng)

  //transform coordinates to container point
  var tl_pixels = map.latLngToContainerPoint(tl)
  var br_pixels = map.latLngToContainerPoint(br)

  //compute the number of pixels between the left (resp. top) of the image and the position of the mouse (not yet magnified)
  var pixels_on_left = mouseX - tl_pixels.x
  var pixels_on_top = mouseY - tl_pixels.y

  //compute tl position of the magnified image
  var magnified_tl_pixels = L.point(mouseX - pixels_on_left * magnifyingRatio,
                                    mouseY - pixels_on_top * magnifyingRatio)

  var image_width = (map.latLngToLayerPoint(br).x - map.latLngToLayerPoint(tl).x) * magnifyingRatio
  var image_height = (map.latLngToLayerPoint(br).y - map.latLngToLayerPoint(tl).y) * magnifyingRatio

  imgs_EV.attr('width', image_width)
  imgs_EV.attr('height', image_height)

  //then translate the preview to the right place, so that the center of the circle corresponds to the position of the mouse on the map
  imgs_EV.attr("transform",
    "translate(" +
      (+ magnified_tl_pixels.x - mouseX + svg_width/2) + "," +
      (+ magnified_tl_pixels.y - mouseY + svg_height/2) + ")"
  )
}

/**
 * Update the dynamic content of the histogram depending on the current layer
 */
function update_chart(layerURL) {
  var i = shared.currentChartIndex
  var voro = shared.currentChartIndexIsVoronoi
  var cachedLayers = shared.cachedLayers
  var info = cachedLayers[layerURL]

  if (shared.isFuture && Config.layers[layerURL].future){ //if we are displaying a future version of this layer
    info = cachedLayers[Config.layers[layerURL].future]
  }
  if (!info) { //if the layer isn't loaded yet, don't display anything
    return;
  }
  var data=[]
  if (i < 0){ //none selected, show data about entire Paris region
    data = info.entire_hist
  }
  else if (voro == true) {
    data = info.voronoi_hist[i] //show data about this voronoi
  } else {
    data = info.interComm_hist[i] //show data about this intercomm
  }

  //TODO: don't exclude Urban cooling (when another raster is available), but right now the layer has only three different values so it looks way better with 0 values
  //otherwise, many rasters have a lot of 0 values, so the scale is compressed and we don't see anything, it is better to hide them
  if (layerURL != Config.Urban_cooling){
    data[0]=0 // ignore 0 values
  }
  
  //redraw histogram
  shared.onHistChange(helpers_f.range(256),data)

}

/**
 * Udpate the text of the number of schools
 */
function update_text_school(layerURL){
  var i = shared.currentChartIndex
  var voro = shared.currentChartIndexIsVoronoi
  var cachedLayers = shared.cachedLayers

  if(layerURL == Config.Urban_cooling){ //only display text on waterCooling layer!

    var info = cachedLayers[Config.Ecole_path] //infos about the current layer
    if (!info) { //if the layer is not loaded yet, don't update anything
        return;
    }
    var data=[]
    if (i < 0){
      data = info.entire_hist.slice(-1).pop() //none selected, show the entire number of schools
    }
    else if (voro == true) {
      data = info.voronoi_hist[i].slice(-1).pop() //a voronoi is selected, show its number of schools
    } else {
      data = info.interComm_hist[i].slice(-1).pop() //an intercomm is selected, show its number of schools
    }
    shared.onSchools(data)
  }
  else{
    shared.onSchools(null) //don't show the number of schools
  }
}

/**
 * Updates the marker element on the map with the right coordinates.
 */
function updateMarker() {
  var map = shared.map
  var currentGeoLat = shared.currentGeoLat
  var currentGeoLng = shared.currentGeoLng
  var markerElement = shared.markerElement
  if (currentGeoLat && currentGeoLng) { //if position is defined

    const point = map.latLngToLayerPoint([currentGeoLat, currentGeoLng]) //project it to the map container
    const x = point.x - shared.markerIcon.iconAnchor[0]
    const y = point.y - shared.markerIcon.iconAnchor[1]
    markerElement.attr('visibility', 'visible')
    markerElement.attr('transform', `translate(${x}, ${y})`)
  } else {
    markerElement.attr('visibility', 'hidden') //if the position is undefined, hide the marker
  }
}
/**
 * Update the map. To be called whenever the map's zoom change, or a layer is changed
 */
function updateMap() {

  var map = shared.map
  var cachedLayers = shared.cachedLayers
  var voronoi = shared.voronoi
  var interComms = shared.interComms
  var imgs = shared.imgs
  var imgs_EV = shared.imgs_EV
  var update_parameters = shared.update_parameters
  var path = shared.pathGenerator

  //if we are completely dezoomed, don't select any intercomm, for convenience
  if (map.getZoom() == 9){
    deselectInterComm()
  }

  if (update_parameters.hide) { // if we should hide the map (e.g. it is not loaded yet)
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

  //top-left and bottom-right positions, the anchor points of the selected layer
  var tl = update_parameters.tl
  var br = update_parameters.br

  console.log('UPDATING')
  var width = (map.latLngToLayerPoint(br).x - map.latLngToLayerPoint(tl).x)
  var height = (map.latLngToLayerPoint(br).y - map.latLngToLayerPoint(tl).y)

  //place the image acording to the top-left pixel, in map container space
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
  interComms.attr("d", path)//redraw intercomms
  voronoi.attr("d", path)//redraw voronois

  //udpate the current clip of the displayed layer (if any), the map has moved!
  update_clip()
  //redraw the marker
  updateMarker()

  //hide the circles, for now (or they would be off!)
  shared.svg_EV.style("display","none")
  shared.svg_circle_EV.style("display","none")
}

/**
 * Deselects the current intercomm, if any was selected. Revert intercomm colors to their initial states
 */
function deselectInterComm(){
  shared.interComms.style("pointer-events", "all") //reactivate mouse events
  shared.highlightedInterComm = -1

  shared.interComms.style("fill", function(_,j){
    if (!Config.layers[shared.currentLayerPath].useColorScheme){ //if there is no defined color scale, show a slight grey overlay
      return "#00000011"
    }
    return shared.cachedLayers[shared.currentLayerPath].colorScale(shared.cachedLayers[shared.currentLayerPath].interComm_means[j]) //else set the mean acording to the color scale
  })

  shared.interComms.style("fill-opacity", 1) //fill the intercomms
  shared.voronoi.style("fill-opacity", 0) //hide the voronois
  shared.voronoi.style("stroke-opacity", 0)

  //hide the circles
  shared.svg_EV.style("display","none")
  shared.svg_circle_EV.style("display","none")
}

/**
 * Update the path of the layer displayed displayed in the circle preview
 */
function updateCirclePreviewPath(){
  if (shared.showFutureInsteadOfEV && Config.layers[shared.currentLayerPath].future){ //if show future/present instead of EV

    if (shared.isFuture){ //if show present
      shared.currentCircleLayerPath = shared.currentLayerPath
      shared.svg_circle_EV.style("border-color",Config.color_present)
      shared.svg_EV.style("border-color",Config.color_present)
    }
    else{ //if show future
      shared.currentCircleLayerPath = Config.layers[shared.currentLayerPath].future
      shared.svg_circle_EV.style("border-color",Config.color_future)
      shared.svg_EV.style("border-color",Config.color_future)
    }
  }
  else{ //if show EV
    shared.currentCircleLayerPath = Config.EV_path
    shared.svg_circle_EV.style("border-color",Config.color_ev)
    shared.svg_EV.style("border-color",Config.color_ev)
  }
}

/**
 * Set the image inside the circle preview
 */
function updateCirclePreviewLayer(){
  updateCirclePreviewPath()
  var layer_path = shared.currentCircleLayerPath
  if (!shared.cachedLayers[layer_path] || !shared.showCirclePreview){ //if we should not display the circle, or the layer is not loaded yet
    return
  }
  shared.imgs_EV.attr("xlink:href", shared.cachedLayers[layer_path].url)
}

export default{update_clip,updateCirclePreview,update_chart,update_text_school,updateMarker,updateMap,updateCirclePreviewPath,updateCirclePreviewLayer,deselectInterComm}