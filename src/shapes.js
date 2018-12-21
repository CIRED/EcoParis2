var Config = require('./config.json')
import helpers_f from './helpers.js'
import shared from './shared.js'
import update_f from'./update.js'

/**
 * returns a function that, gived data p and voronoi index j, returns one if and only if the voronoi j is inside the interComm interCommIndex
 */
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

/**
 * Defines the voronoi entity. Given an svg container (and some opacity parameters), will return a d3.selectAll("path") element defining the inner areas (i.e. voronois)
 */
function defineVoronoi(svg){
  return svg.append("g").selectAll("path")
    .data(shared.voronoi_shape.features)
    .enter().append('path')
    .attr('d', shared.pathGenerator)
    .attr('vector-effect', 'non-scaling-stroke')
    .style('stroke', "#666")
    .style("fill-opacity", 0)
    .style("stroke-opacity", 0)
    .on("mouseover", function(d, i) { 
      // when the mouse hovers it, it should show the data behind, and become transparent
      d3.select(this).style('fill-opacity', 0);

      //update the data clip to show the layer inside this voronoi
      shared.defs_path.datum(d.geometry)
      update_f.update_clip()

      //additionally, update the right elements according to current voronoi
      shared.currentChartIndex = i
      shared.currentChartIndexIsVoronoi = true
      update_f.update_chart(shared.currentLayerPath)
      update_f.update_text_school(shared.currentLayerPath)

      if (shared.highlightedInterComm != -1){
        shared.onNewName(shared.interComm_shape.features[shared.highlightedInterComm].properties.nomgroup)
      }
    })
    .on("mouseout", function(d, i) {
      //when the mouse goes out of this area, we should revert changes
      if (shared.highlightedInterComm != -1) {
        //if we are inside an interComm, fill again voronois inside the current interComm
        d3.select(this).style('fill-opacity', oneIfInInterComm(shared.highlightedInterComm)(d, i));
        d3.select(this).style('stroke-opacity', oneIfInInterComm(shared.highlightedInterComm)(d, i));
      }

      //revert clip for this area
      shared.defs_path.datum([])
      update_f.update_clip()
      shared.svg_EV.style("display","none")
      shared.svg_circle_EV.style("display","none")

      shared.currentChartIndex = -1 // none selected, display data about entire Paris
      update_f.update_chart(shared.currentLayerPath)
      update_f.update_text_school(shared.currentLayerPath)

      shared.lastMousePosition={x:-300,y:-300}
    })
    .on("dblclick", function() {
      update_f.deselectInterComm()

      shared.map.fitBounds(shared.initialBounds) // zoom back to paris

      shared.defs_path.datum([])
      update_f.update_clip()
    })
    .on("mousemove",function(){
      if (d3.event && d3.event.clientX && d3.event.clientY && shared.currentLayerPath != Config.EV_path){
        shared.lastMousePosition={x:d3.event.clientX,y:d3.event.clientY - shared.mapElement.getBoundingClientRect().top}
        update_f.update_EV_preview(shared.lastMousePosition.x,shared.lastMousePosition.y)
      }
      else{
        shared.svg_EV.style("display","none")
        shared.svg_circle_EV.style("display","none")
      }
    })
    .on("mousedown",function(){
      if (d3.event && d3.event.clientX && d3.event.clientY && shared.currentLayerPath != Config.EV_path){
        shared.lastMouseDownX = d3.event.clientX
        shared.lastMouseDownY = d3.event.clientY - shared.mapElement.getBoundingClientRect().top
      }
    });
}

/**
 * Defines the voronoi entity. Given an svg container (and some opacity parameters), will return a d3.selectAll("path") element defining the inner areas (i.e. voronois)
 */
function defineInterComms(svg,fadedOpacity){
  return svg.append("g").selectAll("path")
    .data(shared.interComm_shape.features)
    .enter().append('path')
    .attr('d', shared.path)
    .attr('vector-effect', 'non-scaling-stroke')
    .style('stroke', "#333")
    .attr("fill", "#fff")
    .attr("fill-opacity", 1)
    .style("pointer-events", "all")
    .on("mouseover", function(d, i) {
      if (shared.highlightedInterComm != -1) { // i.e. we are zoomed in
        if (i != shared.highlightedInterComm) {
          if (!Config.layers[shared.currentLayerPath].useColorScheme){
            d3.select(this).style("fill","#00000011")
          }
          else{
            d3.select(this).style("fill",shared.cachedLayers[shared.currentLayerPath].colorScale(shared.cachedLayers[shared.currentLayerPath].interComm_means[i]))
          }
          
          d3.select(this).style('fill-opacity', 1);
        } else {
          //should never happen
        }
      } else { // we are zoomed in a particular interComm
        d3.select(this).style('fill-opacity', fadedOpacity);
      }
      shared.currentChartIndex = i
      shared.currentChartIndexIsVoronoi = false
      update_f.update_chart(shared.currentLayerPath)
      update_f.update_text_school(shared.currentLayerPath)

      //console.log(shared.interComm_shape.features[i].properties.nomgroup)
      shared.onNewName(shared.interComm_shape.features[i].properties.nomgroup)
    })
    .on("mouseout", function(d, i) {
      if (shared.highlightedInterComm != -1) { // i.e. we are not zoomed in
        if (i != shared.highlightedInterComm) {
          d3.select(this).style("fill","#000")
          d3.select(this).style('fill-opacity', fadedOpacity);
        } else {
          //should never happen
        }
      } else { // we are zoomed in a particular interComm
        d3.select(this).style('fill-opacity', 1);
      }
      shared.svg_EV.style("display","none")
      shared.svg_circle_EV.style("display","none")

      shared.currentChartIndex = -1 // none selected, display data about entire Paris
      update_f.update_chart(shared.currentLayerPath)
      update_f.update_text_school(shared.currentLayerPath)
      
      shared.lastMousePosition={x:-300,y:-300} //be sure not to display the preview circle!
      shared.onNewName('')
    })
    .on("click", function(d, i) {
      if (!d3.event || !d3.event.clientX || !d3.event.clientY ||
          Math.abs(d3.event.clientX - shared.lastMouseDownX) >= 5 || Math.abs(d3.event.clientY  - shared.mapElement.getBoundingClientRect().top - shared.lastMouseDownY) >= 5){
        return
      }
      shared.interComms.style("pointer-events", "all") // now we can click/hover on every department
      d3.select(this).style("pointer-events", "none") // except the current one!

      shared.interComms.style("fill","#000")
      shared.interComms.style('fill-opacity', fadedOpacity);
      d3.select(this).style('fill-opacity', 0);
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
        shared.lastMousePosition={x:d3.event.clientX,y:d3.event.clientY - shared.mapElement.getBoundingClientRect().top}
        update_f.update_EV_preview(shared.lastMousePosition.x,shared.lastMousePosition.y)
      }
      else{
        shared.svg_EV.style("display","none")
        shared.svg_circle_EV.style("display","none")
      }
    })
    .on("mousedown",function(){
      if (d3.event && d3.event.clientX && d3.event.clientY){
        //console.log(d3.event)
        shared.lastMouseDownX = d3.event.clientX
        shared.lastMouseDownY = d3.event.clientY - shared.mapElement.getBoundingClientRect().top
      }
    });
}

export default {defineVoronoi,defineInterComms}