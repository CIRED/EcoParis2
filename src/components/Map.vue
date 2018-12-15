<template>
  <section ref="map" class="map">
  </section>
</template>

<script>
import Config from '../config.json'
import displayMap from '../map'

export default {
  props: ['layers', 'currentLayerPath', 'currentLocation', 'onHist', 'appRefs', 'onSchools'],
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
        [this.loadLayer, this.setLayer, this.setLocation, this.setEVLayer, this.setTextUrban] =
          displayMap(this.$refs.map,this.appRefs.svg,this.appRefs.circle_svg,this.appRefs.legend, e, d, v, (x, y) => this.onHist(x,y), this.onSchools)

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
