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
  shared.legend_element = legend_element

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


  /**
   * Sets the position of the geolocation marker to the current position
   * of the user (computed using the Geolocation API).
   */
  function setLocationFromCurrent() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        helpers_f.setLocation(pos.coords.latitude, pos.coords.longitude)
      })
    }
  }

  setLocationFromCurrent()

  helpers_f.createMap(element) //TODO: if the window is small, the zoom is too far (> 14) and the map is grey, untill we zoom in

  L.geoJson(interComm_shape, {
    style: helpers_f.blankStyle
  }).addTo(shared.map); //needed! otherwise a svg isn't generated, we use this one for practical purposes

  var svg = d3.select(element).select(".leaflet-zoom-animated")

  function projectPoint(x, y) {
    var point = shared.map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
  }
  var transform = d3.geo.transform({
    point: projectPoint
  });
  shared.pathGenerator = d3.geo.path()
    .projection(transform);

  var defs = svg.append("defs");
  shared.defs_path = defs.append("path")
    .attr("id", "clip_path")

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

  update_f.update_clip()


  var emptyOpacity = 0
  var fadedOpacity = 0.4
  var semiFullOpacity = 0.7
  var fullOpacity = 1

  shared.svg_EV = d3.select(EV_svg_element)
    .attr("style","display:none;")

  shared.svg_circle_EV = d3.select(EV_circle_svg_element)
    .attr("style","display:none;")

  shared.imgs_EV = shared.svg_EV.selectAll("image").data([0])
    .enter()
    .append("svg:image")
    .attr('x', 0)
    .attr('y', 0)
    .attr("xlink:href", "")

  var shape_EV = shared.svg_EV.append("g")
  shape_EV
    .selectAll("path")
    .data([interComm_shape.features[0]])
    .enter().append('path')
    .attr('vector-effect', 'non-scaling-stroke')
    .style('stroke', "#000")
    .style("fill-opacity", 0)
    .style("stroke-opacity", 1)


  shared.voronoi = shapes_f.defineVoronoi(svg,emptyOpacity,fullOpacity)

  shared.interComms = shapes_f.defineInterComms(svg,emptyOpacity,fadedOpacity,fullOpacity)

  shared.markerIcon = {
    iconUrl: 'assets/marker.png',
    iconSize: [24, 24],
    iconAnchor: [12, 24]
  }

  shared.markerElement = svg.append("g").selectAll("image").data([0])
    .enter()
    .append("svg:image")
    .attr("xlink:href", shared.markerIcon.iconUrl)
    .attr("width", shared.markerIcon.iconSize[0])
    .attr("height", shared.markerIcon.iconSize[1])
    .attr('visibility', 'hidden')
    .style("pointer-events", "none")

  shared.canvas = document.createElement("canvas")

  shared.update_parameters = {
    hide: true,
  };

  shared.map.on('viewreset', function(){update_f.updateMap()})

  return [layers_f.loadLayer, layers_f.setLayer, helpers_f.setLocation, layers_f.setEVLayer]
}