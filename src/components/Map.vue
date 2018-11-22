<template>
  <section ref="map" class="map"></section>
</template>

<script>
import displayMap from '../map'

export default {
  /**
   * Triggers when the component has been mounted.
   * This is used to create the Leaflet map and bind the event handlers.
   */
  mounted () {
    var urlDepartment = 'data/depts.geojson'
    var urlVoronoi = 'data/sd-voronoi.json'

    queue()
      .defer(d3.json, urlDepartment)
      .defer(d3.json, urlVoronoi)
      .await((e, d, v) => displayMap(this.$refs.map, e, d, v))
  }
}
</script>

<style lang="scss" type="text/scss">
.map {
  flex: 1;
}

.leaflet-overlay-pane {
  mix-blend-mode: multiply;
}
</style>
