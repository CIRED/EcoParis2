var Config = require('./config.json')
import helpers_f from './helpers.js'
import shared from './shared.js'

function update_clip() {
  var map = shared.map
  var cachedLayers = shared.cachedLayers
  var currentLayerPath = shared.currentLayerPath
  var defs_path = shared.defs_path
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

function update_EV_preview(mouseX,mouseY){
  var svg_EV = shared.svg_EV
  var svg_circle_EV = shared.svg_circle_EV
  var map = shared.map
  var cachedLayers = shared.cachedLayers
  var imgs_EV = shared.imgs_EV

  var layer_path = Config.EV_path
  if (!cachedLayers[Config.EV_path]){
    return
  }

  var svg_width = parseInt(svg_EV.style("width").substr(0,svg_EV.style("width").length-2))
  var svg_height = parseInt(svg_EV.style("height").substr(0,svg_EV.style("width").length-2))
  var svg_circle_width = parseInt(svg_circle_EV.style("width").substr(0,svg_circle_EV.style("width").length-2))
  var svg_circle_height = parseInt(svg_circle_EV.style("height").substr(0,svg_circle_EV.style("width").length-2))

  svg_EV.attr("style","top:"+(mouseY - svg_height - 15)+"px; left:"+(mouseX +15)+"px; display:'';")
  shared.svg_circle_EV.attr("style","top:"+(mouseY - svg_circle_height/2)+"px; left:"+(mouseX - svg_circle_width/2)+"px; display:'';")

  var magnifyingRatio = svg_width/svg_circle_width

  var tl = L.latLng(cachedLayers[layer_path].tl_lat,cachedLayers[layer_path].tl_lng)
  var br = L.latLng(cachedLayers[layer_path].br_lat,cachedLayers[layer_path].br_lng)

  var tl_pixels = map.latLngToContainerPoint(tl)
  var br_pixels = map.latLngToContainerPoint(br)

  var pixels_on_left = mouseX - tl_pixels.x
  var pixels_on_top = mouseY - tl_pixels.y

  var magnified_tl_pixels = L.point(mouseX - pixels_on_left * magnifyingRatio,
                                    mouseY - pixels_on_top * magnifyingRatio)

  var image_width = (map.latLngToLayerPoint(br).x - map.latLngToLayerPoint(tl).x) * magnifyingRatio
  var image_height = (map.latLngToLayerPoint(br).y - map.latLngToLayerPoint(tl).y) * magnifyingRatio

  imgs_EV.attr('width', image_width)
  imgs_EV.attr('height', image_height)

  imgs_EV.attr("transform",
    "translate(" +
      (+ magnified_tl_pixels.x - mouseX + svg_width/2) + "," +
      (+ magnified_tl_pixels.y - mouseY + svg_height/2) + ")"
  )
}

function update_chart(i,layerURL,voro) {
  var cachedLayers = shared.cachedLayers
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
  shared.onHistChange(helpers_f.range(256),data)

}

function update_text_school(i,layerURL,voro){
  var cachedLayers = shared.cachedLayers
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
    shared.onSchools(data)
  }
  else{
    shared.onSchools(null)
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
  if (currentGeoLat && currentGeoLng) {
    const point = map.latLngToLayerPoint([currentGeoLat, currentGeoLng])
    const x = point.x - shared.markerIcon.iconAnchor[0]
    const y = point.y - shared.markerIcon.iconAnchor[1]
    markerElement.attr('visibility', 'visible')
    markerElement.attr('transform', `translate(${x}, ${y})`)
  } else {
    markerElement.attr('visibility', 'hidden')
  }
}

function updateMap() {//add here everything that could potentially change
  var map = shared.map
  var cachedLayers = shared.cachedLayers
  var voronoi = shared.voronoi
  var interComms = shared.interComms
  var imgs = shared.imgs
  var imgs_EV = shared.imgs_EV
  var update_parameters = shared.update_parameters
  var path = shared.pathGenerator

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
  shared.svg_EV.attr("style","display:none;")
  shared.svg_circle_EV.attr("style","display:none;")
}

export default{update_clip,update_EV_preview,update_chart,update_text_school,updateMarker,updateMap}