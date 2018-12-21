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

	```sh
    $ brew install node
    ```

Then, to install the project, use `npm install`.

- To start a development version with hot-reloading, use `npm run serve`.
- To compile and minify the project for production, use `npm run build`.
- To deploy the project to https://ecoparis.github.io, use `npm run release`.
- To lint and fix files, use `npm run lint`.
