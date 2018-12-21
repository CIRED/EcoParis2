import Config from './config.json'

import helpers_f from './helpers.js'
import update_f from './update.js'
import layers_f from './layers.js'
import shapes_f from './shapes.js'
import shared from './shared.js'

export default function(element, EV_svg_element, EV_circle_svg_element, legend_element, error, interComm_shape, voronoi_shape, interCommContainment, voronoiContainment, onHistChange, onSchools, onNewName) {
  //for convenience
  shared.interComm_shape = interComm_shape
  shared.voronoi_shape = voronoi_shape
  shared.onHistChange = onHistChange
  shared.onSchools = onSchools
  shared.onNewName = onNewName
  shared.legend_element = legend_element
  shared.interCommContainment = interCommContainment
  shared.voronoiContainment = voronoiContainment
  shared.mapElement = element

  document.body.addEventListener("keypress",helpers_f.handleKeyEvent) //add a keyboard listener to the main container 

  //default top left position
  const default_tl = new L.LatLng(
    Config.viewport.topLatitude,
    Config.viewport.leftLongitude
  )
  //default bottom right position
  const default_br = new L.LatLng(
    Config.viewport.bottomLatitude,
    Config.viewport.rightLongitude
  )
  //set view to initial bounds
  shared.initialBounds = L.latLngBounds(default_tl, default_br)

  //for now, hide the legend
  d3.select(legend_element).style("display","none")

  //create legend canvas and svg
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

  helpers_f.createMap(element)//create the map

  //show a default hidden layer on the map to force it to create its overlay svg, for practical purposes (this one follows transitions smoothly!)
  L.geoJson(interComm_shape, {
    style: helpers_f.blankStyle
  }).addTo(shared.map);

  var svg = d3.select(element).select(".leaflet-zoom-animated")

  //from lat lng to x,y inside the svg
  function projectPoint(x, y) {
    var point = shared.map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
  }
  var transform = d3.geo.transform({
    point: projectPoint
  });
  shared.pathGenerator = d3.geo.path()
    .projection(transform);

  //used later to clip the layer image to a selected voronoi
  var defs = svg.append("defs");
  shared.defs_path = defs.append("path")
    .attr("id", "clip_path")

  defs.append("clipPath")
    .attr("id", "clip")
    .append("use")
    .attr("xlink:href", "#clip_path");

  //define the layer image, the one that contains the real data (not average!)
  shared.imgs = svg.selectAll("image").data([0])
    .enter()
    .append("svg:image")
    .attr('x', 0)
    .attr('y', 0)
    .attr("xlink:href", "")
    .attr("clip-path", "")
    .attr("preserveAspectRatio","none")
    .style("object-fit","cover")

  //initialize the clip (it will hide the image entirely for now)
  update_f.update_clip()


  var fadedOpacity = 0.4
  var semiFullOpacity = 0.7

  //svg used by the circle preview
  shared.svg_EV = d3.select(EV_svg_element)
    .attr("style","display:none;")

  //svg used by the 
  shared.svg_circle_EV = d3.select(EV_circle_svg_element)
    .attr("style","display:none;")

  //svg used to display the current layer image on the map
  shared.imgs_EV = shared.svg_EV.selectAll("image").data([0])
    .enter()
    .append("svg:image")
    .attr('x', 0)
    .attr('y', 0)
    .attr("xlink:href", "")
    .attr("preserveAspectRatio","none")
    .style("object-fit","cover")

  //define the voronoi shapes
  shared.voronoi = shapes_f.defineVoronoi(svg)

  //define the intercomm shapes
  shared.interComms = shapes_f.defineInterComms(svg,fadedOpacity)

  //marker used to pin location
  shared.markerIcon = {
    iconUrl: 'assets/marker.png',
    iconSize: [24, 24],
    iconAnchor: [12, 24]
  }

  //create the marker element
  shared.markerElement = svg.append("g").selectAll("image").data([0])
    .enter()
    .append("svg:image")
    .attr("xlink:href", shared.markerIcon.iconUrl)
    .attr("width", shared.markerIcon.iconSize[0])
    .attr("height", shared.markerIcon.iconSize[1])
    .attr('visibility', 'hidden')
    .style("pointer-events", "none")

  //create a canvas, used to compute layer images
  shared.canvas = document.createElement("canvas")

  //a dict of parameters used by the update functions. Will be filled later when needed
  shared.update_parameters = {
    hide: true,
  };

  //add a listener on the map, will be called whenever we need to re-draw the overlay
  shared.map.on('viewreset', function(){update_f.updateMap()})

  const zoomOut = shared.map.zoomOut.bind(shared.map)
  const zoomIn = shared.map.zoomIn.bind(shared.map)

  return [layers_f.loadLayer, layers_f.setLayer, helpers_f.setLocation, layers_f.setEVLayer, zoomOut, zoomIn]
}