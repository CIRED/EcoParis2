//this file contains a set of variables. Those variables should be treated as global variables, and can be used anywhere
//used because otherwise, we would have either a 800 lines file, or 15 parameters functions...

var cachedLayers = {} //placehoder for the layers, to compute them only once

var currentLayerPath = "" //path of the currently selected layer

var map = null //reference to the leaflet map

var currentGeoLat = null //current latitude of the cursor

var currentGeoLng = null //current longitude of the cursos

var svg_EV = null //reference to the svg of the "espaces verts"

var svg_circle_EV = null //reference to the svg of the circle around the cursot

var interComms = null //reference to the interComms element, i.e. a d3.selectAll("path")

var voronoi = null //reference to the voronoi element, i.e. a d3.selectAll("path")

var imgs = null //reference to the current layer image, i.e. a d3.selectAll("image")

var imgs_EV = null //reference to the "espaces verts" image, i.e. a d3.selectAll("image")

var update_parameters = {} //parameters used by the update function, such as tl/br coordinates, or a "hide" boolean

var markerElement = null //reference to marker element, i.e. a d3.selectAll("image")

var canvas = null //reference to the canvas used to generate layers

var voronoi_shape = null //shapes of the voronois, content of the geojson

var interComm_shape = null //shapes of the interComms, content of the geojson

var firstVoronoiByInterComm = [] //array containing infos about the id of the first voronoi inside a given interComm, since voronoi ids are consecutive (e.g. ids 0-7 are inside interComm 0)

var pathGenerator = null //pathGenerator, used to project paths (latLng) on the map

var defs_path = null //reference to the d3.selectAll("path") used to crop the layer to the current voronoi area

var legend_element = null //element (div) that will contain the layer legend

var color_legend_canvas = null //element (canvas) that will contain the layer legend (the colors)

var color_legend_svg = null //element (div) that will contain the layer legend (the labels)

var onSchools = null //onSchools callback function, called when the number of schools changes (e.g. we hovered another area)

var onHistChange = null //onHistChange callback function, called when the histogram must be changed (e.g. we hovered another area)

var highlightedInterComm = -1 //id of the currently highlighted interComm

var initialBounds = null //initial bounds of the map (set to paris)

var markerIcon = {} //informations about the marker icon

var lastMouseDownX = 0 //coordinates of the last mouse Down event

var lastMouseDownY = 0 //coordinates of the last mouse Down event

var voronoiContainment = null //precomputed containment tests for the voronois

var interCommContainment = null //precomputed containment tests for the interComms

var showCirclePreview = true //do we show the circle preview, or do we hide it?

var showFutureInsteadOfEV = false //do we show the future preview in the circle instead of the EV?

var lastMousePosition = {x:0,y:0} //last known position of the mouse

var isFuture = false

var currentCircleLayerPath = ""

export default {cachedLayers,
				currentLayerPath,
				map,
				currentGeoLat,
				currentGeoLng,
				svg_EV,
				svg_circle_EV,
				interComms,
				voronoi,
				imgs,
				imgs_EV,
				update_parameters,
				markerElement,
				canvas,
				voronoi_shape,
				interComm_shape,
				firstVoronoiByInterComm,
				pathGenerator,
				defs_path,
				legend_element,
				color_legend_canvas,
				color_legend_svg,
				onSchools,
				onHistChange,
				highlightedInterComm,
				initialBounds,
				markerIcon,
				lastMouseDownX,
				lastMouseDownY,
				voronoiContainment,
				interCommContainment,
				showCirclePreview,
				showFutureInsteadOfEV,
				lastMousePosition,
				isFuture,
				currentLayerPath}