<template>
  <section ref="map" class="map"></section>
</template>

<script>
import Config from '../config.json'
import displayMap from '../map'

export default {
  props: ['layers', 'currentLayer', 'currentLocation', 'onHist'],
  data: () => ({
    loadLayer: () => {},
    setLayer: () => {},
    setLocation: () => {},
  }),

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
        [this.loadLayer, this.setLayer, this.setLocation, this.setEVLayer] =
          displayMap(this.$refs.map, e, d, v, (d, _) => this.onHist(d),Config.EV_path)

        Config.layers.forEach(layer => this.loadLayer(
          layer.path,
          layer.color_low,
          layer.color_high,
          () => {
            this.layers[layer.path].loaded = true
            if (layer.path == Config.EV_path){
              console.log(layer.path)
              this.setEVLayer(layer.path)
            } 
          }
        ))

        this.setLayer(this.currentLayer)
      })
  },

  watch: {
    /**
     * Watches changes to the currentLayer prop, and updates the map.
     */
    currentLayer(layer) {
      this.setLayer(layer)
    },

    /**
     * Watches changes to the currentLocation prop, and updates the marker.
     */
    currentLocation([lat, lng]) {
      this.setLocation(lat, lng)
    }
  }
}
</script>

<style lang="scss" type="text/scss">
.map {
  flex: 1;
}

.leaflet-overlay-pane {
  mix-blend-mode: multiply;

  image {
    image-rendering: optimizespeed;
  }
}
</style>
