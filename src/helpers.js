const colorSchemeDict = {
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
const MAP_ATTRIB = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
/**
 * Creates a Leaflet map of the Paris area and returns it.
 */
function createMap (element) {
  shared.map = L.map(element, {
    zoomControl: false
  })
  var map = shared.map
  map.fitBounds(shared.initialBounds)
  map.setMaxBounds(map.getBounds().pad(0.025))

  const base = L.tileLayer(MAP_TILES, {
    minZoom: 9,
    maxZoom: 14, // Toner Light won't zoom further than 14.
    attribution: MAP_ATTRIB
  })

  base.addTo(map)

  map.setView(new L.LatLng(48.856614,2.3522219),map.getZoom()+2)
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
function setLocation (lat, lng) {z
  if (!lat || !lng || !isWithinParis([lng, lat])) {
    lat = null
    lng = null
    shared.map.fitBounds(shared.initialBounds)
  } else {
    //console.log(lat,lng)
    shared.map.setView(new L.LatLng(lat, lng),11)
    //shared.map.setZoom(11)
  }

  shared.currentGeoLat = lat
  shared.currentGeoLng = lng
  update_f.updateMarker()
}


function getColorsFromScheme (colorSchemeId){
  var currentScheme = colorSchemeDict[colorSchemeId]
  var range = []
  for (var i=0; i<256; ++i){
    range.push(currentScheme(i/255))
  }
  
  return range
}


// create continuous color legend
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

    if (invertColorScheme){
      pos = (legendHeight - margin.top - margin.bottom - 1)*4 - i*4
    }
    image.data[pos] = c.r;
    image.data[pos + 1] = c.g;
    image.data[pos + 2] = c.b;
    image.data[pos + 3] = 255;
  }
  
  ctx.putImageData(image, 0, 0);

  var domain = [maxValue, minValue]
  if (invertColorScheme){
    domain = [minValue, maxValue]
  }
  var legendAxis = d3.axisRight()
    .scale(d3.scaleLinear().domain(domain).range([1, legendHeight - margin.bottom - margin.top - 1]))
    .tickSize(6)
    .ticks(8);

  var svg = scale_svg
    .attr("height", `${legendHeight}px`)
    .attr("width", `${legendWidth}px`)
    .style("position", "absolute")
    .style("left", "0px")
    .style("top", "0px")

  svg
    .select("g")
    .attr("class", "axis")
    .attr("transform", `translate(${legendWidth - margin.left - margin.right}, ${margin.top - 1})`)
    .call(legendAxis);
}


function computeColorRange (percentiles,colors){
  var domain_percentiles = percentiles.slice()
  domain_percentiles.unshift(0)
  domain_percentiles.push(255)

  var domainLength = domain_percentiles.length
  var rangeLength  = colors.length

  var intermediateDomain = []
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


function blankStyle (feature) {
  return {
    opacity: 0,
    fillOpacity: 0
  };
}

function range (length){
  var range = []
  for (var i=0; i<length; ++i){
    range[i]=i
  }
  return range
}

function handleKeyEvent(e){
  if (e && (e.charCode || e.keyCode) == 120){ // 'x' key
    shared.showCirclePreview = ! shared.showCirclePreview
  }
  if (e && (e.charCode || e.keyCode) == 32){ // space bar
    shared.showFutureInsteadOfEV = ! shared.showFutureInsteadOfEV
  }
  update_f.updateCirclePreviewLayer()
  update_f.update_EV_preview(shared.lastMousePosition.x,shared.lastMousePosition.y)
}

export default {loadContainmentFile,createMap,setLocation,getColorsFromScheme,fillScale,computeColorRange,blankStyle,range,handleKeyEvent}