var Config = require('./config.json')
var helpers_f = require('./helpers.js')

exports.update_clip = function(map,cachedLayers,currentLayerPath,defs_path) {
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

exports.update_EV_preview = function(mouseX,mouseY,cachedLayers,svg_EV,svg_circle_EV,map,imgs_EV){

  var layer_path = Config.EV_path
  if (!cachedLayers[Config.EV_path]){
    return
  }

  svg_EV.style("width").substr(0,svg_EV.style("width").length-2)
  var svg_width = parseInt(svg_EV.style("width").substr(0,svg_EV.style("width").length-2))
  var svg_height = parseInt(svg_EV.style("height").substr(0,svg_EV.style("width").length-2))

  //console.log(mouseX,mouseY)
  svg_EV.attr("style","top:"+(mouseY - svg_height - 30)+"; left:"+(mouseX - svg_width/2)+"; display:'';")
  svg_circle_EV.attr("style","top:"+(mouseY - svg_height/2)+"; left:"+(mouseX - svg_width/2)+"; display:'';")


  var tl = L.latLng(cachedLayers[layer_path].tl_lat,cachedLayers[layer_path].tl_lng)
  var br = L.latLng(cachedLayers[layer_path].br_lat,cachedLayers[layer_path].br_lng)

  var tl_pixels = map.latLngToContainerPoint(tl)
  var br_pixels = map.latLngToContainerPoint(br)

  var image_width = (map.latLngToLayerPoint(br).x - map.latLngToLayerPoint(tl).x)
  var image_height = (map.latLngToLayerPoint(br).y - map.latLngToLayerPoint(tl).y)

  imgs_EV.attr('width', image_width)
  imgs_EV.attr('height', image_height)

  imgs_EV.attr("transform",
    "translate(" +
      (+ tl_pixels.x - mouseX + svg_width/2) + "," +
      (+ tl_pixels.y - mouseY + svg_height/2) + ")"
  )
}

exports.update_chart = function(i,layerURL,voro,cachedLayers,onHistChange) {
  var info = cachedLayers[layerURL]
  if (!info) {
    return;
  }
  var data=[]
  if (voro == true) {
    data = info.voronoi_hist[i]
  } else {
    data = info.interComm_hist[i]
  }

  data[0]=0 // ignore 0 values
  onHistChange(helpers_f.range(256),data)

}

exports.update_text_school = function(i,layerURL,voro,cachedLayers,onSchools){
  if(layerURL==Config.Urban_cooling){
    var info = cachedLayers[Config.Ecole_path]
    if (!info) {
        return;
    }
    var data=[]
    if (voro == true) {
      data = info.voronoi_hist[i]
    } else {
      data = info.interComm_hist[i]
    }
    onSchools(data)
    // change texte according to data 
  }
  else{
    onSchools(null)
  }
}

/**
 * Updates the marker element on the map with the right coordinates.
 */
exports.updateMarker = function(current_geoLat,current_geoLong,map,markerElement) {
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

exports.updateMap = function(update_parameters,interComms,voronoi,imgs,imgs_EV,map,svg_EV,svg_circle_EV,current_geoLat,current_geoLong,markerElement,path,cachedLayers,currentLayerPath,defs_path) {//add here everything that could potentially change
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
  exports.update_clip(map,cachedLayers,currentLayerPath,defs_path)
  exports.updateMarker(current_geoLat,current_geoLong,map,markerElement)
  svg_EV.attr("style","display:none;")
  svg_circle_EV.attr("style","display:none;")
}