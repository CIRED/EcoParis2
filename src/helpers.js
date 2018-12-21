const colorSchemeDict = { //dictionary of predefined color scales references in config.json. See "https://github.com/d3/d3-scale-chromatic"
  0:d3.interpolateOranges,
  1:d3.interpolateRdBu,
  2:d3.interpolateBlues,
  3:d3.interpolateGnBu,
  4:d3.interpolateRdYlGn,
}

import shared from './shared.js'
import update_f from './update.js'
var Config = require('./config.json')

/**
 * Loads a JSON containment file and parses it.
 */
function loadContainmentFile (url) {
  return fetch(url)
    .then(res => res.json())
    .then(json => {
      json.data = JSON.parse(json.data)
      return json
    })
}

const MAP_TILES = 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png'
const MAP_ATTRIB = 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'

/**
 * Creates a Leaflet map of the Paris area and returns it.
 */
function createMap (element) {
  shared.map = L.map(element, {
    zoomControl: false
  })
  var map = shared.map
  map.fitBounds(shared.initialBounds) //set initial view
  map.setMaxBounds(map.getBounds().pad(0.025)) //pad max bounds, to have a little bit of freedom around paris, but not too much

  const base = L.tileLayer(MAP_TILES, {
    minZoom: 9,  //limit minimum zoom to a large Paris overview
    maxZoom: 14, // Toner Light won't zoom further than 14.
    attribution: MAP_ATTRIB
  })

  base.addTo(map)

  map.setView(new L.LatLng(48.856614,2.3522219),map.getZoom()+2) // zoom a bit more on Paris, initially
}

/**
 * Returns whether a given point is within the Paris region.
 */
function isWithinParis(point) {
  return shared.interComm_shape.features.some(s => d3.geoContains(s, point))
}

/**
 * Sets the position of the geolocation marker.
 */
function setLocation (lat, lng) {
  if (!lat || !lng || !isWithinParis([lng, lat])) {
    //if the lat and lng are not defined or not within Paris
    lat = null
    lng = null 
  } else {
    shared.map.setView(new L.LatLng(lat, lng),11) //zoom to position
  }

  shared.currentGeoLat = lat
  shared.currentGeoLng = lng

  //update current position, and update marker icon
  update_f.updateMarker()
}

/**
 * Returns a range of 256 colors, depending on its id in the colorSchemeDict
 */
function getColorsFromScheme (colorSchemeId){
  var currentScheme = colorSchemeDict[colorSchemeId]
  var range = []
  for (var i=0; i<256; ++i){
    range.push(currentScheme(i/255))
  }
  
  return range
}

/**
 * Fill continuous color legend
 */
function fillScale (scale_canvas, scale_svg, colorScale, minValue, maxValue, invertColorScheme) {
  const legendHeight = 200
  const legendWidth = 70
  const margin = {top: 5, right: 30, bottom: 5, left: 0}

  var canvas = scale_canvas
    .attr("height", legendHeight - margin.top - margin.bottom)
    .attr("width", 1)
    .style("height", (legendHeight - margin.top - margin.bottom) + "px")
    .style("width", (legendWidth - margin.left - margin.right) + "px")
    .style("position", "absolute")
    .style("top", (margin.top) + "px")
    .style("left", (margin.left) + "px")
    .node();

  var ctx = canvas.getContext("2d");

  var legendScale = height =>
    colorScale(((legendHeight - margin.top - margin.bottom) - height)/ (legendHeight - margin.top - margin.bottom) * 255)

  var image = ctx.createImageData(1, (legendHeight - margin.top - margin.bottom));

  for (var i=0; i<legendHeight - margin.top - margin.bottom; ++i){
    var c = d3.rgb(legendScale(i));
    var pos = i*4;

    if (invertColorScheme){ //if invertColorScheme, the legend should be displayer upside-down, so invert pos
      pos = (legendHeight - margin.top - margin.bottom - 1)*4 - i*4
    }
    image.data[pos] = c.r;
    image.data[pos + 1] = c.g;
    image.data[pos + 2] = c.b;
    image.data[pos + 3] = 255;
  }
  
  ctx.putImageData(image, 0, 0); //fill scale colors

  var domain = [maxValue, minValue]
  if (invertColorScheme){
    domain = [minValue, maxValue]
  }

  var legendAxis = d3.axisRight() //create vertical axis
    .scale(d3.scaleLinear().domain(domain).range([1, legendHeight - margin.bottom - margin.top - 1]))
    .tickSize(6)
    .ticks(8);

  var svg = scale_svg
    .attr("height", `${legendHeight}px`)
    .attr("width", `${legendWidth}px`)
    .style("position", "absolute")
    .style("left", "0px")
    .style("top", "0px")

  svg //fill svg with filled axis
    .select("g")
    .attr("class", "axis")
    .attr("transform", `translate(${legendWidth - margin.left - margin.right}, ${margin.top - 1})`)
    .call(legendAxis);
}


/**
 * Compute a domain/range pair, based on the given colors and perentiles.
 * It will make sure that each percentile i corresponds to an equal fraction of the colors scale.
 *
 * For example, two percentiles (0, 10, 90, 100) and four colors (a,b,c,d):
 * 0-10 will be mapped linearly to a range between a and b (33% of the color scale)
 * 10-90 will be mapped linearly to a range between b and c (from 33% to 66%)
 * 90-100 will be mapped linearly to a range between c and d (from 66% to 100%)
 */
function computeColorRange (percentiles,colors){
  var domain_percentiles = percentiles.slice()
  domain_percentiles.unshift(0) //remove 0 and 255 values, they are always here
  domain_percentiles.push(255)

  var domainLength = domain_percentiles.length
  var rangeLength  = colors.length

  var intermediateDomain = [] //from linear 0-1 scale to output color
  for (var i=0; i<rangeLength; ++i){
    intermediateDomain[i] = i/(rangeLength-1)
  }
  var intermediateScale = d3.scale.linear().domain(intermediateDomain).range(colors)

  var range_out = []
  for (var i=0; i<domainLength; ++i){
    var t = i/(domainLength-1)
    range_out.push(intermediateScale(t))
  }
  return [domain_percentiles,range_out]
}

/**
 * Returns a blank style for the map
 */
function blankStyle (feature) {
  return {
    opacity: 0,
    fillOpacity: 0
  };
}

/**
 * Returns a (0,length-1) array
 */
function range (length){
  var range = []
  for (var i=0; i<length; ++i){
    range[i]=i
  }
  return range
}

/**
 * Handles keyboard events
 */
function handleKeyEvent(e){
  if (e && (e.charCode || e.keyCode) == 120){ // 'x' key

    shared.showCirclePreview = ! shared.showCirclePreview //toggle circle hidden state
  }
  if (e && (e.charCode || e.keyCode) == 32){ // space bar
    shared.showFutureInsteadOfEV = ! shared.showFutureInsteadOfEV //toggle circle future/EV state
  }
  //then redraw circles
  update_f.updateCirclePreviewLayer()
  update_f.updateCirclePreview(shared.lastMousePosition.x,shared.lastMousePosition.y)
}

export default {loadContainmentFile,createMap,setLocation,getColorsFromScheme,fillScale,computeColorRange,blankStyle,range,handleKeyEvent}