<template>
  <div class="map-container">
    <section ref="map" class="map"></section>

    <svg ref="circle_svg" class="EV-circle-svg"></svg> 
    <svg ref="svg" class="EV-svg"></svg>

    <div class="legend" v-if="isEspacesVerts">
      <p>Espace verts</p>
    </div>
    <div class="legend" v-else>
      <div ref="legend" class="legend-inner"></div>
      <p>(mm.mol<sup>-1</sup>)</p>
    </div>
  </div>
</template>

<script>
import Config from '../config.json'
import displayMap from '../map'

export default {
  props: ['layers', 'currentLayerPath', 'currentLocation', 'currentZoom', 'onHist', 'onSchools'],
  data: () => ({
    loadLayer: () => {},
    setLayer: () => {},
    setLocation: () => {},
    setEVLayer: () => {},
    setTextUrban: () => {},
    zoomMinus: () => {},
    zoomPlus: () => {},
  }),

  computed: {
    isEspacesVerts() {
      return this.currentLayerPath == Config.EV_path;
    }
  },

  /**
   * Triggers when the component has been mounted.
   * This is used to create the Leaflet map and bind the event handlers.
   */
  mounted () {
    var urlInterComm = 'data/intercommunalites.geojson'
    var urlVoronoi = 'data/voronois.json'

    queue()
      .defer(d3.json, urlInterComm)
      .defer(d3.json, urlVoronoi)
      .await((e, d, v) => {
        // FIXME(liautaud): Please, clean up this mess.
        [this.loadLayer, this.setLayer, this.setLocation, this.setEVLayer, this.zoomMinus, this.zoomPlus] =
          displayMap(
            this.$refs.map,
            this.$refs.svg,
            this.$refs.circle_svg,
            this.$refs.legend,
            e, d, v,
            this.onHist,
            this.onSchools
          )

        Object.keys(Config.layers).forEach(layerPath => {

        this.layers[layerPath].path=layerPath;
        this.loadLayer(
          layerPath,
          () => {
            this.layers[layerPath].loaded = true
            
            if (layerPath == Config.EV_path){
              this.setEVLayer(layerPath)
            }          
          }
        )})

        this.setLayer(this.currentLayerPath)
      })
  },

  watch: {
    /**
     * Watches changes to the currentLayerPath prop, and updates the map.
     */
    currentLayerPath(layerPath) {
      this.setLayer(layerPath)
    },

    /**
     * Watches changes to the currentLocation prop, and updates the marker.
     */
    currentLocation([lat, lng]) {
      this.setLocation(lat, lng)
    },

    /**
     * Watches changes to the currentZoom prop, and updates the marker.
     */
    currentZoom(after, before) {
      // FIXME(liautaud): This only takes +/-1 changes into account.
      // It's a dirty hack anyway, we should hold the currentZoom instead.
      if (after < before) {
        this.zoomMinus()
      } else {
        this.zoomPlus()
      }
    }
  }
}
</script>

<style lang="scss" type="text/scss">
.map-container {
  flex: 1;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
}

.leaflet-overlay-pane {
  mix-blend-mode: multiply;

  image {
    image-rendering: optimizespeed;
  }
}

.EV-svg {
  border-radius: 50%;
  width: 120px;
  height: 120px;
  border: 1px solid #000;
  box-shadow: 0 0 3px rgba(#000, .3);
  position: absolute;
  background: #fff;
  display: flex;
  pointer-events: none;
  top: -120px;

  image {
    image-rendering: optimizespeed;
  }
}

.EV-circle-svg {
  border-radius: 50%;
  width: 90px;
  height: 90px;
  border: 1px solid rgba(#000, .7);
  position: absolute;
  background: #fff0;
  display: flex;
  pointer-events: none;
  top: -120px;
}

.legend {
  position: absolute;
  bottom: 30px;
  right: 20px;
  width: 90px;
  text-align: center;

  border: 1px solid #bbb;
  box-shadow: 0 0 3px rgba(#000, .2);
  background: #fff;

  p {
    font-size: .6em;
    font-style: italic;
    margin-top: 0;
  }
}

.legend-inner {
  height: 200px;
  width: 70px;
  margin: 8px auto;
  position: relative;
}

.legend-inner canvas {
  box-sizing: border-box;
  border: 1px solid #000;
  border-right: 0;
}
</style>
