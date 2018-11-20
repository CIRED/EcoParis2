<template>
  <section ref="map" class="map"></section>
</template>

<script>
const MAP_TILES = 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png'
const MAP_ATTRIB = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'

export default {
  /**
   * Triggers when the component has been mounted.
   * This is used to create the Leaflet map and bind the event handlers.
   */
  mounted () {
    const initialBounds = L.latLngBounds(
      new L.LatLng(49.2485668, 1.4403262),
      new L.LatLng(48.1108602, 3.5496114))

    const map = L.map(this.$refs.map, { zoomControl: false })
    map.fitBounds(initialBounds)

    const base = L.tileLayer(MAP_TILES, {
      maxZoom: 14, // Toner Light won't zoom further than 14.
      attribution: MAP_ATTRIB
    })

    base.addTo(map)
  }
}
</script>

<style lang="scss" type="text/scss">
.map {
  flex: 1;
}
</style>
