<template>
  <section ref="map" class="map"></section>
</template>

<script>
import displayMap from '../map_create_voronoi'

export default {
  props: ['currentLayer'],
  data: () => ({
    setLayer: () => {},
  }),

  /**
   * Triggers when the component has been mounted.
   * This is used to create the Leaflet map and bind the event handlers.
   */
  mounted () {
    var urlDepartment = 'data/backup/intercommunalites.geojson'
    var urlVoronoi = 'data/backup/voronois_final.json'

    queue()
      .defer(d3.json, urlDepartment)
      .defer(d3.json, urlVoronoi)
      .await((e, d, v) => {
        this.setLayer = displayMap(this.$refs.map, e, d, v)
        this.setLayer(this.currentLayer)
      })
  },

  watch: {
    /**
     * Watches changes to the currentLayer prop, and updates the map.
     */
    currentLayer(layer) {
      this.setLayer(layer)
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
