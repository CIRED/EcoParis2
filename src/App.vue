<template>
  <div id="app">
    <transition name="fade">
      <Intro v-if="introVisible" :onDismiss="() => introVisible = false" />
    </transition>

    <section class="menu">
      <LocationControl
        :onLocation="loc => this.currentLocation = loc" />
      <Layers v-model="currentLayer" />
      <ZoomControl />
    </section>
    <section class="container">
      <Map
        :currentLayer="currentLayer"
        :currentLocation="currentLocation"
        :onHist="hist => this.currentHistogram = hist" />
      <Sidebar
        :currentLayer="currentLayer"
        :currentHistogram="currentHistogram" />
    </section>
  </div>
</template>

<script>
import Intro from './components/Intro.vue'
import ZoomControl from './components/ZoomControl.vue'
import LocationControl from './components/LocationControl.vue'
import Layers from './components/Layers.vue'
import Map from './components/Map.vue'
import Sidebar from './components/Sidebar.vue'

export default {
  data: () => ({
    currentLayer: 'data/p_export.json',
    currentLocation: null,
    currentHistogram: null,
    introVisible: false,
    // introVisible: true,
    sidebarVisible: false,
  }),

  components: { Intro, ZoomControl, LocationControl, Layers, Map, Sidebar }
}
</script>

<style lang="scss" type="text/scss">
html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  font-size: 15pt;
}

#app {
  width: 100%;
  height: 100%;
  font-family: 'IBM Plex Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h2 {
  font-size: 1.4rem;
}

p {
  font-family: 'Crimson Text', serif;
}

.button {
  text-decoration: none;
  margin: 1.2rem;
  font-size: 14pt;
  padding: 9px 13px;
  border: 1px solid #fff;
  color: #fff;
  text-transform: uppercase;
  font-weight: 300;
  transition: padding .2s;
  position: relative;
  outline: none;

  &:hover {
    padding: 9px 16px;
  }
}

.menu {
  z-index: 500;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 50px;
  display: flex;
  flex-direction: column;

  justify-content: center;
}

.container {
  display: flex;
  background: #000;
  width: 100%;
  height: 100%;
}

.zoom-control, .location-control {
  height: 40px;
  border: 1px solid #bbb;
  box-shadow: 0 0 3px rgba(#000, .2);
  background: #fff;
  display: flex;
  flex-basis: content;

  a {
    outline: none;
    height: 40px;
    width: 39px;
    font-family: Courier New;
    font-size: 18pt;
    line-height: 40px;
    text-align: center;
    text-decoration: none;
    color: #000;
  }

  a:first-child {
    border-right: 1px solid #bbb;
  }
}
</style>
