import Config from './config.json'

var helpers_f = require("./helpers.js")
var update_f = require("./update.js")
var layers_f = require("./layers.js")
var shapes_f = require("./shapes.js")
var shared = require("./shared.js")

export default function(element, EV_svg_element, EV_circle_svg_element, legend_element, error, interComm_shape, voronoi_shape, onHistChange, onSchools) {
  shared.interComm_shape = interComm_shape
  shared.voronoi_shape = voronoi_shape
  shared.onHistChange = onHistChange
  shared.onSchools = onSchools

  const default_tl = new L.LatLng(
    Config.viewport.topLatitude,
    Config.viewport.leftLongitude
  )
  const default_br = new L.LatLng(
    Config.viewport.bottomLatitude,
    Config.viewport.rightLongitude
  )
  shared.initialBounds = L.latLngBounds(default_tl, default_br)

  shared.color_legend_canvas = d3.select(legend_element)
    .append("canvas")

  shared.color_legend_svg = d3.select(legend_element)
    .append("svg")
  shared.color_legend_svg.append("g")
  shared.legend_element = legend_element

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
      map.fitBounds(shared.initialBounds)
    } else {
      map.panTo(new L.LatLng(lat, lng))
      map.setZoom(11)
    }

    shared.currentGeoLat = lat
    shared.currentGeoLng = lng
    update_f.updateMarker()
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

  helpers_f.createMap(element) //TODO: if the window is small, the zoom is too far (> 14) and the map is grey, untill we zoom in
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
  shared.pathGenerator = d3.geo.path()
    .projection(transform);
  var path = shared.pathGenerator

  var defs = svg.append("defs");
  shared.defs_path = defs.append("path")
    .attr("id", "clip_path")

  var defs_path = shared.defs_path
  defs.append("clipPath")
    .attr("id", "clip")
    .append("use")
    .attr("xlink:href", "#clip_path");

  shared.imgs = svg.selectAll("image").data([0])
    .enter()
    .append("svg:image")
    .attr('x', 0)
    .attr('y', 0)
    .attr("xlink:href", "")
    .attr("clip-path", "")
  var imgs = shared.imgs

  update_f.update_clip()


  var emptyOpacity = 0
  var fadedOpacity = 0.4
  var semiFullOpacity = 0.7
  var fullOpacity = 1

  shared.svg_EV = d3.select(EV_svg_element)
    .attr("style","display:none;")
  var svg_EV = shared.svg_EV
  shared.svg_circle_EV = d3.select(EV_circle_svg_element)
    .attr("style","display:none;")
  var svg_circle_EV = shared.svg_circle_EV

  shared.imgs_EV = svg_EV.selectAll("image").data([0])
    .enter()
    .append("svg:image")
    .attr('x', 0)
    .attr('y', 0)
    .attr("xlink:href", "")
  var imgs_EV = shared.imgs_EV

  var shape_EV = svg_EV.append("g")
  shape_EV
    .selectAll("path")
    .data([interComm_shape.features[0]])
    .enter().append('path')
    .attr('vector-effect', 'non-scaling-stroke')
    .style('stroke', "#000")
    .style("fill-opacity", 0)
    .style("stroke-opacity", 1)


  shared.voronoi = shapes_f.defineVoronoi(svg,emptyOpacity,fullOpacity)

  var voronoi = shared.voronoi

  shared.highlightedInterComm = -1

  shared.interComms = shapes_f.defineInterComms(svg,emptyOpacity,fadedOpacity,fullOpacity)

  var interComms = shared.interComms

  shared.markerIcon = {
    iconUrl: 'assets/marker.png',
    iconSize: [24, 24],
    iconAnchor: [12, 24]
  }
  var markerIcon = shared.markerIcon

  shared.markerElement = svg.append("g").selectAll("image").data([0])
    .enter()
    .append("svg:image")
    .attr("xlink:href", markerIcon.iconUrl)
    .attr("width", markerIcon.iconSize[0])
    .attr("height", markerIcon.iconSize[1])
    .attr('visibility', 'hidden')
    .style("pointer-events", "none")

  shared.canvas = document.createElement("canvas")
  var canvas = shared.canvas
  var context = canvas.getContext('2d');

  shared.update_parameters = {
    hide: true,
  };
  var update_parameters = shared.update_parameters


  map.on('viewreset', function(){update_f.updateMap()})

  var cachedLayers = shared.cachedLayers //placehoder for the layers, to compute them only once

  function setEVLayer(path){
    imgs_EV.attr("xlink:href", cachedLayers[Config.EV_path].url)
  }

  return [layers_f.loadLayer, layers_f.setLayer, setLocation, setEVLayer]
}