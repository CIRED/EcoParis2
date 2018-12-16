const colorSchemeDict = {
  0:d3.interpolateRdYlBu,
  1:d3.interpolateBuGn,
  2:d3.interpolateCool
}

var shared =  require('./shared.js')

/**
 * Loads a JSON containment file and parses it.
 */
exports.loadContainmentFile = function(url) {
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
exports.createMap = function(element) {
  shared.map = L.map(element, {
    zoomControl: false
  })
  var map = shared.map
  map.fitBounds(shared.initialBounds)

  const base = L.tileLayer(MAP_TILES, {
    minZoom: 9,
    maxZoom: 14, // Toner Light won't zoom further than 14.
    attribution: MAP_ATTRIB
  })

  base.addTo(map)
}


exports.getColorsFromScheme = function(colorSchemeId){
  var currentScheme = colorSchemeDict[colorSchemeId]
  var range = []
  for (var i=0; i<256; ++i){
    range.push(currentScheme(i/255))
  }
  return range
}


// create continuous color legend
exports.fillScale = function(scale_canvas, scale_svg, colorScale, minValue, maxValue) {
  var legendheight = 200,
      legendwidth = 80,
      margin = {top: 10, right: 40, bottom: 10, left: 2};

  var canvas = scale_canvas
    .attr("height", legendheight - margin.top - margin.bottom)
    .attr("width", 1)
    .style("height", (legendheight - margin.top - margin.bottom) + "px")
    .style("width", (legendwidth - margin.left - margin.right) + "px")
    .style("border", "1px solid #000")
    .style("position", "absolute")
    .style("top", (margin.top) + "px")
    .style("left", (margin.left) + "px")
    .node();

  var ctx = canvas.getContext("2d");


  var legendscale = function(height) {
    return colorScale(((legendheight - margin.top - margin.bottom) - height)/ (legendheight - margin.top - margin.bottom) * 255)
  }

  var image = ctx.createImageData(1, (legendheight - margin.top - margin.bottom));

  for (var i=0; i<legendheight - margin.top - margin.bottom; ++i){
    var c = d3.rgb(legendscale(i));
    image.data[4*i] = c.r;
    image.data[4*i + 1] = c.g;
    image.data[4*i + 2] = c.b;
    image.data[4*i + 3] = 255;
  }
  
  ctx.putImageData(image, 0, 0);

  var legendaxis = d3.axisRight()
    .scale(d3.scaleLinear().domain([maxValue,minValue]).range([1,legendheight - margin.bottom - margin.top]))
    .tickSize(6)
    .ticks(8);

  var svg = scale_svg
    .attr("height", (legendheight) + "px")
    .attr("width", (legendwidth) + "px")
    .style("position", "absolute")
    .style("left", "0px")
    .style("top", "0px")

  svg
    .select("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + (legendwidth - margin.left - margin.right + 3) + "," + (margin.top) + ")")
    .call(legendaxis);
}


exports.computeColorRange = function(percentiles,colors){
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


exports.blankStyle = function(feature) {
  return {
    opacity: 0,
    fillOpacity: 0
  };
}

exports.range = function(length){
  var range = []
  for (var i=0; i<length; ++i){
    range[i]=i
  }
  return range
}