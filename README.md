<p align="center" style="margin-bottom: 1em;">
    <img src="logo.png">
</p>

_EcoParis_ is an interactive visualization of the benefits of nature in the Paris area. It was built by EPFL students as part of the [Data Visualization](https://edu.epfl.ch/coursebook/en/data-visualization-COM-480) (COM-480) class, in association with the [IDEFESE](https://idefese.wordpress.com/) and [Natural Capital](https://naturalcapitalproject.stanford.edu/) projects.

## Overview.

This project uses:
- Vue.js for the layout of the overall application.
- Leaflet.js to display the map below.
- D3.js for the actual visualization, coupled with `d3-geo`, `d3-interpolate`, and `d3-color`.
- The [Stamen tileserver](http://maps.stamen.com) for the Toner Lite tileset.


## Usage.

First, you need to install NodeJS using your favorite package manager. For example, with Homebrew:

`$ brew install node`

Then, you will need to clone both repositories in a single folder (git@github.com:ecoparis/EcoParis.git and git@github.com:ecoparis/ecoparis.github.io.git)

To install the project, use `npm install` in the EcoParis repository.

- To start a development version with hot-reloading, use `npm run serve`.
- To compile and minify the project for production, use `npm run build`.
- To deploy the project to https://ecoparis.github.io, use `npm run release`.
- To lint and fix files, use `npm run lint`.

## Content.

The project hierarchy is as follows:

- `public`: static data to be downloaded by the browser
    - `assets`: external scripts and images
    - `data`: pre-computed jsons necessary for the visualization
        - `rasters`: preprocessed raster files
- `src`: main App component and settings file
    - `components`: web page dynamic components
    - `locales`: frensh-english translations
    
    as well as source code:
    - `main.js`: main function, mounts the app
    - `map.js`: functions used to create the map and initialize the components
    - `shapes.js`: functions used to generate the intercommunalities and voronois shapes and behaviour
    - `layers.js`: functions used to load, preprocess and switch layers
    - `update.js`: functions used to update elements (map, sidebar, scale,...)
    - `helpers.js`: contains various helper functions
    - `shared.js`: contains shared variables needed by multiple files 
    - `config.json`: contains informations about the layers to display

## Notes.

There are several parsing scripts required to add new data on other branches:

1) `generate_image_json`: Contains the script used to parse a new raster file. Instructions are detailed in the file `js/parseImage.js`.
2) `generate_correlation`: Contains the script used to generate the hotspots layers. Instructions are detailed in the file `js/correlation_4.js`.
3) `generate_voronois`: Contains the script used to compute the voronoi GeoJson. Instructions are detailed in the file `js/parseImage.js`.
4) `generate_containment_json`: Contians the script used to generate the pre-computed containment files. Instructions are detailed in the file `js/parseImage.js`.

If you want to:

- <b>Update texts, layer informations or colors, or other parameters</b>: on the main branch, update src/config.json. It contains every information that can be parametrized currently. If you simply want to update texts, you can have a look at src/locales/ files, they contains texts and translations.
- <b>Add a raster</b>: run script 1), and add the raster (on the main branch) in the public/data/rasters folder, and update config.json acordingly. If it should be used in the computations of the hotspots layer, also run 2), and update the hotspots raster acordingly.
- <b>Change the voronois, or also change the interComms</b>: Choose a suitable GeoJson for the main separations. Run script 3) with it until the new voronoi json is ready. Run 4) to update the containment tests. Replace those files in the main branch.
