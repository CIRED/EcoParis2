//this file contains a set of variables. Those variables should be treated as global variables, and can be used anywhere
//used because otherwise, we would have either a 800 lines file, or 15 parameters functions...

exports.cachedLayers = {} //placehoder for the layers, to compute them only once

exports.currentLayerPath = "" //path of the currently selected layer

exports.map = null //reference to the leaflet map

exports.currentGeoLat = null //current latitude of the cursor

exports.currentGeoLng = null //current longitude of the cursos

exports.svg_EV = null //reference to the svg of the "espaces verts"

exports.svg_circle_EV = null //reference to the svg of the circle around the cursot

exports.interComms = null //reference to the interComms element, i.e. a d3.selectAll("path")

exports.voronoi = null //reference to the voronoi element, i.e. a d3.selectAll("path")

exports.imgs = null //reference to the current layer image, i.e. a d3.selectAll("image")

exports.imgs_EV = null //reference to the "espaces verts" image, i.e. a d3.selectAll("image")

exports.update_parameters = {} //parameters used by the update function, such as tl/br coordinates, or a "hide" boolean

exports.markerElement = null //reference to marker element, i.e. a d3.selectAll("image")

exports.canvas = null //reference to the canvas used to generate layers

exports.voronoi_shape = null //shapes of the voronois, content of the geojson

exports.interComm_shape = null //shapes of the interComms, content of the geojson

exports.firstVoronoiByInterComm = [] //array containing infos about the id of the first voronoi inside a given interComm, since voronoi ids are consecutive (e.g. ids 0-7 are inside interComm 0)

exports.pathGenerator = null //pathGenerator, used to project paths (latLng) on the map

exports.defs_path = null //reference to the d3.selectAll("path") used to crop the layer to the current voronoi area

exports.legend_element = null //element (div) that will contain the layer legend

exports.color_legend_canvas = null //element (canvas) that will contain the layer legend (the colors)

exports.color_legend_svg = null //element (div) that will contain the layer legend (the labels)

exports.onSchools = null //onSchools callback function, called when the number of schools changes (e.g. we hovered another area)

exports.onHistChange = null //onHistChange callback function, called when the histogram must be changed (e.g. we hovered another area)

exports.highligthedInterComm = -1 //id of the currently highlighted interComm

exports.initialBounds = null //initial bounds of the map (set to paris)

exports.markerIcon = {} //informations about the marker icon