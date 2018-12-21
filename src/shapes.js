var Config = require('./config.json')
import helpers_f from './helpers.js'
import shared from './shared.js'
import update_f from'./update.js'

/**
 * returns a function that, gived data p and voronoi index j, returns one if and only if the voronoi j is inside the interComm interCommIndex
 * used by the interComm and voronoi shapes definitions
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
 * Defines the voronoi entity. Given an svg container, will return a d3.selectAll("path") element defining the inner areas (i.e. voronois)
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
    .on("mouseover", function(d, i) { //when the mouse enters the area

      // when the mouse hovers it, it should show the data behind, and become transparent
      d3.select(this).style('fill-opacity', 0);

      //update the data clip to show the layer inside this voronoi
      shared.defs_path.datum(d.geometry)
      update_f.update_clip()

      //additionally, update the sidebar elements according to current voronoi
      shared.currentChartIndex = i
      shared.currentChartIndexIsVoronoi = true
      update_f.update_chart(shared.currentLayerPath)
      update_f.update_text_school(shared.currentLayerPath)

      //if some interComm is displayed, still display its name
      if (shared.highlightedInterComm != -1){
        shared.onNewName(shared.interComm_shape.features[shared.highlightedInterComm].properties.nomgroup)
      }
    })
    .on("mouseout", function(d, i) { //when the mouse exits the area

      //when the mouse goes out of this area, we should revert changes
      if (shared.highlightedInterComm != -1) {
        //if we are inside an interComm, fill again voronois inside the current interComm, we could be hidden to show data behind
        d3.select(this).style('fill-opacity', oneIfInInterComm(shared.highlightedInterComm)(d, i));
        d3.select(this).style('stroke-opacity', oneIfInInterComm(shared.highlightedInterComm)(d, i));
      }

      //revert clip for this area
      shared.defs_path.datum([])
      update_f.update_clip()
      shared.svg_EV.style("display","none")
      shared.svg_circle_EV.style("display","none")

      shared.currentChartIndex = -1 // none selected, display data about entire Paris

      //update sidebar informations
      update_f.update_chart(shared.currentLayerPath)
      update_f.update_text_school(shared.currentLayerPath)

      //remember that last mouse position was ouside of the screen. If the mouse do not enter another area, we are sure the circles won't be displayed
      shared.lastMousePosition={x:-300,y:-300}
    })
    .on("dblclick", function() { //when the used double-clicks
      update_f.deselectInterComm() //reset current intercomm selection

      shared.map.fitBounds(shared.initialBounds) // zoom back to paris

      //revert image clip
      shared.defs_path.datum([])
      update_f.update_clip()
    })
    .on("mousemove",function(){ //when the mouse moves inside the area

      if (d3.event && d3.event.clientX && d3.event.clientY && shared.currentLayerPath != Config.EV_path){ //if an event is well defined (and we should not show it for EV)

        //update last mouse position, and recompute circle overlay position and content
        shared.lastMousePosition={x:d3.event.clientX,y:d3.event.clientY - shared.mapElement.getBoundingClientRect().top}
        update_f.updateCirclePreview(shared.lastMousePosition.x,shared.lastMousePosition.y)
      }
      else{
        //no defined event, simply don't display circles
        shared.svg_EV.style("display","none")
        shared.svg_circle_EV.style("display","none")
      }
    })
    .on("mousedown",function(){ //the the mouse is pressed
      if (d3.event && d3.event.clientX && d3.event.clientY && shared.currentLayerPath != Config.EV_path){ //if an event is well defined

        //update last mouse down positions, so that we can know on the next mouse up whether it should be considered as a click or not
        shared.lastMouseDownX = d3.event.clientX
        shared.lastMouseDownY = d3.event.clientY - shared.mapElement.getBoundingClientRect().top //the top of the map might move here!
      }
    });
}

/**
 * Defines the voronoi entity. Given an svg container (and some opacity parameter), will return a d3.selectAll("path") element defining the inner areas (i.e. voronois)
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
    .on("mouseover", function(d, i) { //when the mouse enters the area

      if (shared.highlightedInterComm != -1) { // i.e. we are zoomed in a certain interComm
        if (i != shared.highlightedInterComm) { //but another intercomm!

          if (!Config.layers[shared.currentLayerPath].useColorScheme){ //if the current layer don't use a color scheme, show it as brighter (EV!)
            d3.select(this).style("fill","#00000011")
          }
          else{ //else if the layer uses a color scale, display real average color
            d3.select(this).style("fill",shared.cachedLayers[shared.currentLayerPath].colorScale(shared.cachedLayers[shared.currentLayerPath].interComm_means[i]))
          }
          
          d3.select(this).style('fill-opacity', 1); //anyway, should be opaque
        } else {
          //should never happen, the seleced interComm should be deactivated
        }
      } else { // we are not zoomed in any particular interComm
        d3.select(this).style('fill-opacity', fadedOpacity); //so we are on the main map, simply hide this area a bit to highlight it
      }

      //update sidebar with this intercomm's informations
      shared.currentChartIndex = i
      shared.currentChartIndexIsVoronoi = false
      update_f.update_chart(shared.currentLayerPath)
      update_f.update_text_school(shared.currentLayerPath)

      //notify that the name of the hovered intercomm should change
      shared.onNewName(shared.interComm_shape.features[i].properties.nomgroup)
    })
    .on("mouseout", function(d, i) { //when the mouse exits the area, revert changes

      if (shared.highlightedInterComm != -1) { // i.e. we are zoomed in
        if (i != shared.highlightedInterComm) { // but this intercomm is not the one displayed!
          //go back to a grey color
          d3.select(this).style("fill","#000")
          d3.select(this).style('fill-opacity', fadedOpacity);
        } else {
          //should never happen, the seleced interComm should be deactivated
        }
      } else { // we are not zoomed in any particular interComm
        //set opacity back to one, we are not hovering it anymore
        d3.select(this).style('fill-opacity', 1);
      }
      //stop displaying circle overlay
      shared.svg_EV.style("display","none")
      shared.svg_circle_EV.style("display","none")

      //update sidebar informations to "no intercomm selected" kinf of data
      shared.currentChartIndex = -1 // none selected, display data about entire Paris
      update_f.update_chart(shared.currentLayerPath)
      update_f.update_text_school(shared.currentLayerPath)
      
      shared.lastMousePosition={x:-300,y:-300} //be sure not to display the preview circle!
      shared.onNewName('')// notify that the currently hovered area name should change
    })
    .on("click", function(d, i) { //when the mouse clicks on the area
      if (!d3.event || !d3.event.clientX || !d3.event.clientY ||
          Math.abs(d3.event.clientX - shared.lastMouseDownX) >= 5 || Math.abs(d3.event.clientY  - shared.mapElement.getBoundingClientRect().top - shared.lastMouseDownY) >= 5){
        //i.e. if the mouse up event is far away from the mouse down event ==> the user wasn't clicking!
        return
      }
      shared.interComms.style("pointer-events", "all") // now we can click/hover on every intercomm
      d3.select(this).style("pointer-events", "none") // except the current one!

      shared.interComms.style("fill","#000")
      shared.interComms.style('fill-opacity', fadedOpacity);
      d3.select(this).style('fill-opacity', 0); //hide this intercomm
      shared.highlightedInterComm = i

      //show only voronois inside this intercomm
      shared.voronoi.style("fill-opacity", oneIfInInterComm(i))
      shared.voronoi.style("stroke-opacity", oneIfInInterComm(i))

      //move map to selected area
      var BBox = d3.select(this).node().getBBox()
      var neBound = shared.map.layerPointToLatLng(L.point(BBox.x, BBox.y))
      var swBound = shared.map.layerPointToLatLng(L.point(BBox.x + BBox.width, BBox.y + BBox.height))
      shared.map.fitBounds(L.latLngBounds(neBound, swBound)) // zoom to department

      //stop displaying circle preview
      shared.svg_EV.attr("style","display:none;")
      shared.svg_circle_EV.attr("style","display:none;")
    })
    .on("mousemove",function(){ //when the mouse moves inside the area
      if (d3.event && d3.event.clientX && d3.event.clientY && shared.currentLayerPath != Config.EV_path){ //if an event is well defined (and we should not show it for EV)

        //update last mouse position, and recompute circle overlay position and content
        shared.lastMousePosition={x:d3.event.clientX,y:d3.event.clientY - shared.mapElement.getBoundingClientRect().top}
        update_f.updateCirclePreview(shared.lastMousePosition.x,shared.lastMousePosition.y)
      }
      else{
        //no defined event, simply don't display circles
        shared.svg_EV.style("display","none")
        shared.svg_circle_EV.style("display","none")
      }
    })
    .on("mousedown",function(){ //the the mouse is pressed
      if (d3.event && d3.event.clientX && d3.event.clientY){ //if an event is well defined
        
        //update last mouse down positions, so that we can know on the next mouse up whether it should be considered as a click or not
        shared.lastMouseDownX = d3.event.clientX
        shared.lastMouseDownY = d3.event.clientY - shared.mapElement.getBoundingClientRect().top //the top of the map might move here!
      }
    });
}

export default {defineVoronoi,defineInterComms}