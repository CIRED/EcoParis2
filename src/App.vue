<template>
  <div id="app">
    <transition name="fade">
      <Intro v-if="introVisible" :onDismiss="() => {
        introVisible = false;
        this.currentLayerPath = this.defaultLayer; }" />
    </transition>

    <section class="menu">
      <LocationControl
        :onLocation="loc => this.currentLocation = loc" />
      <Layers
        :layers="layers"
        v-model="currentLayerPath" />
      <ZoomControl />
    </section>
    <section class="container">
      <Map
        :layers="layers"
        :currentLayerPath="currentLayerPath"
        :currentLocation="currentLocation"
        :onHist="(x,y) => {this.currentHistogramX = x; this.currentHistogramY = y;}" 
        :onSchools="(n) => {}" />
      <Sidebar
        :layers="layers"
        :currentLayerPath="currentLayerPath"
        :currentHistogramX="currentHistogramX"
        :currentHistogramY="currentHistogramY" />
    </section>
  </div>
</template>

<script>
import Config from './config.json'

import Intro from './components/Intro.vue'
import ZoomControl from './components/ZoomControl.vue'
import LocationControl from './components/LocationControl.vue'
import Layers from './components/Layers.vue'
import Map from './components/Map.vue'
import Sidebar from './components/Sidebar.vue'

var defaultLayer = Config.EV_path

export default {
  data: () => ({
    layers: Object.keys(Config.layers).reduce((m, layerPath) => {
      m[layerPath] = Config.layers[layerPath]
      m[layerPath].loaded = false
      m[layerPath].path=layerPath
      return m
    }, {}),

    currentLayerPath: null,
    currentLocation: null,
    currentHistogramX: null,
    currentHistogramY: null,
    introVisible: true,
    sidebarVisible: false,
    defaultLayer: defaultLayer,
    EV_path: Config.EV_path,
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
  font-size: 1.2rem;
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

  &.accent {
    background: rgba(#fff, .2);
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

// TODO(liautaud): Create mixins and move everything
// back in their respective files.
.zoom-control, .location-control {
  height: 40px;
  border: 1px solid #bbb;
  box-shadow: 0 0 3px rgba(#000, .2);
  background: #fff;
  display: flex;
  margin: 20px 0;
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
