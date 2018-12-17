<template>
  <section class="location-control">
    <a href="#" class="locate"
        @click.prevent="locate">
      <i class="fas fa-map-marker-alt"></i>
    </a>
    <div :class="{search: true, active: searchExpanded}">
      <a href="#" @click.prevent="toggleSearch">
        <i v-if="searchExpanded" class="fas fa-search-minus"></i>
        <i v-else class="fas fa-search-location"></i>
      </a>
      <input type="text" class="autocomplete" ref="searchInput"
        @keyup.27="searchExpanded = false">
    </div>
  </section>
</template>

<script>
import Config from '../config.json'

export default {
  props: ['onLocation'],

  data: () => ({
    searchExpanded: false
  }),

  mounted() {
    const api = new google.maps.places.Autocomplete(this.$refs.searchInput)
    api.setFields(['geometry'])
    api.setOptions({strictBounds: true})
    api.setBounds({
      north: Config.viewport.topLatitude,
      south: Config.viewport.bottomLatitude,
      west: Config.viewport.leftLongitude,
      east: Config.viewport.rightLongitude,
    })

    api.addListener('place_changed', () => {
      const place = api.getPlace()

      if (!place.geometry) {
        this.onLocation(null, null)
        return
      }

      this.searchExpanded = false
      this.onLocation([
        place.geometry.location.lat(),
        place.geometry.location.lng()
      ])
    })
  },

  methods: {
    locate() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          if (pos){
            this.onLocation([pos.coords.latitude, pos.coords.longitude])
          }
        })
      }
    },

    toggleSearch() {
      this.searchExpanded ^= true
      this.$refs.searchInput.focus()
    },

    keypressSearch(e) {
      alert(JSON.stringify(e))
    }
  }
}
</script>

<style lang="scss" type="text/scss">
.location-control a i {
  color: #111;
  font-size: 18px;
}

.location-control .search {
  display: flex;
  align-items: center;

  a {
    border: 0 !important;
  }

  .autocomplete {
    transition: width .25s;
    height: 30px;
    width: 0;
    padding: 0;
    border: 0 none;
  }
}

.location-control .search.active .autocomplete {
  width: 300px;
}
</style>
