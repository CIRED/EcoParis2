var Config = require('./config.json')
var helpers_f = require('./helpers.js')
var shared = require('./shared.js')
var update_f = require("./update.js")

function oneIfInInterComm(interCommIndex) {
  function oneIfInInterComm_(p, j) {
    if (shared.firstVoronoiByInterComm[interCommIndex] <= j && (interCommIndex == shared.interComm_shape.features.length - 1 || shared.firstVoronoiByInterComm[interCommIndex + 1] > j)) {
      return 1
    } else {
      return 0
    }
  }
  return oneIfInInterComm_
}

exports.defineVoronoi = function(svg,emptyOpacity,fullOpacity){
  return svg.append("g").selectAll("path")
    .data(shared.voronoi_shape.features)
    .enter().append('path')
    .attr('d', shared.pathGenerator)
    .attr('vector-effect', 'non-scaling-stroke')
    .style('stroke', "#666")
    .style("fill-opacity", emptyOpacity)
    .style("stroke-opacity", emptyOpacity)
    .on("mouseover", function(d, i) {
      d3.select(this).style('fill-opacity', emptyOpacity);
      shared.defs_path.datum(d.geometry)
      update_f.update_clip()
      update_f.update_chart(i, shared.currentLayerPath, true, shared.onHistChange)
      update_f.update_text_school(i, shared.currentLayerPath, false, shared.onSchools)
    })
    .on("mouseout", function(d, i) {
      if (shared.highlightedInterComm != -1) {
        d3.select(this).style('fill-opacity', oneIfInInterComm(shared.highlightedInterComm)(d, i));
        d3.select(this).style('stroke-opacity', oneIfInInterComm(shared.highlightedInterComm)(d, i));
      }

      shared.defs_path.datum([])
      update_f.update_clip()
      shared.svg_EV.attr("style","display:none;")
      shared.svg_circle_EV.attr("style","display:none;")
    })
    .on("click", function(d, i) {
      shared.interComms.style("pointer-events", "all")
      shared.map.fitBounds(shared.initialBounds) // zoom back to paris
      shared.highlightedInterComm = -1
      shared.interComms.style("fill-opacity", fullOpacity)
      shared.voronoi.style("fill-opacity", emptyOpacity)
      shared.voronoi.style("stroke-opacity", emptyOpacity)

      shared.defs_path.datum([])
      update_f.update_clip()
      shared.svg_EV.attr("style","display:none;")
      shared.svg_circle_EV.attr("style","display:none;")
    })
    .on("mousemove",function(){
      if (d3.event && d3.event.clientX && d3.event.clientY && shared.currentLayerPath != Config.EV_path){
        update_f.update_EV_preview(d3.event.layerX,d3.event.layerY)
      }
      else{
        shared.svg_EV.attr("style","display:none;")
        shared.svg_circle_EV.attr("style","display:none;")
      }
    })
}

exports.defineInterComms = function(svg,emptyOpacity,fadedOpacity,fullOpacity){
  return svg.append("g").selectAll("path")
    .data(shared.interComm_shape.features)
    .enter().append('path')
    .attr('d', shared.path)
    .attr('vector-effect', 'non-scaling-stroke')
    .style('stroke', "#333")
    .attr("fill", "#fff")
    .attr("fill-opacity", fullOpacity)
    .style("pointer-events", "all")
    .on("mouseover", function(d, i) {
      if (shared.highlightedInterComm != -1) {
        if (i != shared.highlightedInterComm) {
          d3.select(this).style('fill-opacity', fullOpacity);
        } else {
          d3.select(this).style('fill-opacity', emptyOpacity);
        }
      } else {
        d3.select(this).style('fill-opacity', fadedOpacity);
      }
      //console.log(i)
      update_f.update_chart(i, shared.currentLayerPath, true)
      update_f.update_text_school(i, shared.currentLayerPath, false)
    })
    .on("mouseout", function(d, i) {
      if (shared.highlightedInterComm != -1) {
        if (i == shared.highlightedInterComm) {
          d3.select(this).style('fill-opacity', emptyOpacity);
        } else {
          d3.select(this).style('fill-opacity', fadedOpacity);
        }
      } else {
        d3.select(this).style('fill-opacity', fullOpacity);
      }
      shared.svg_EV.attr("style","display:none;")
      shared.svg_circle_EV.attr("style","display:none;")
    })
    .on("click", function(d, i) {
      shared.interComms.style("pointer-events", "all") // now we can click/hover on every department
      d3.select(this).style("pointer-events", "none") // except the current one!

      shared.interComms.style("fill-opacity", fadedOpacity) //same here, show every intercomm except this one
      d3.select(this).style('fill-opacity', emptyOpacity);
      shared.highlightedInterComm = i


      shared.voronoi.style("fill-opacity", oneIfInInterComm(i))
      shared.voronoi.style("stroke-opacity", oneIfInInterComm(i))

      var BBox = d3.select(this).node().getBBox()
      var neBound = shared.map.layerPointToLatLng(L.point(BBox.x, BBox.y))
      var swBound = shared.map.layerPointToLatLng(L.point(BBox.x + BBox.width, BBox.y + BBox.height))
      shared.map.fitBounds(L.latLngBounds(neBound, swBound)) // zoom to department
      shared.svg_EV.attr("style","display:none;")
      shared.svg_circle_EV.attr("style","display:none;")
    })
    .on("mousemove",function(){
      if (d3.event && d3.event.clientX && d3.event.clientY && shared.currentLayerPath != Config.EV_path){
        //console.log(d3.event)
        update_f.update_EV_preview(d3.event.layerX,d3.event.layerY)
      }
      else{
        shared.svg_EV.attr("style","display:none;")
        shared.svg_circle_EV.attr("style","display:none;")
      }
    });
}