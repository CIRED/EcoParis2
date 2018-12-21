<template>
  <div id="app" :class="[`tutorial-${currentTutorialStep}`]">
    
    <transition name="fade">
      <Intro
        v-if="introVisible"
        :isLoading="!currentLayerLoaded"
        @dismiss="() => introVisible = false" />
    </transition>

    <About v-if="aboutVisible" @dismiss="() => aboutVisible = false" />

    <section class="horizontal-split">
      <Tutorial
        v-model="currentTutorialStep"
        ref="tutorial"
        :currentLayerPath="currentLayerPath"
        @layerChange="path => {this.currentLayerPath = '';this.currentLayerPath = path}" />

      <section class="vertical-split">
        <section class="menu">
          <LocationControl
            :onLocation="loc => this.currentLocation = loc" />
          <Layers
            :layers="layers"
            v-model="currentLayerPath"
            @checkTutorial="()=>{this.$refs.tutorial.checkIfNext()}" />
          <ZoomControl
            @zoomOut="() => currentZoom -= 1"
            @zoomIn="() => currentZoom += 1" />

          <a href="#" class="about-button"
            @click.prevent="() => aboutVisible = true">{{ $t('titles.credits') }}</a>
        </section>

        <Map
          :layers="layers"
          :currentLayerPath="currentLayerPath"
          :currentLocation="currentLocation"
          :currentZoom="currentZoom"
          :isFuture="isFuture"
          @toggleFuture="() => isFuture ^= true"
          @newHistogram="(x, y) => {this.currentHistogramX = x; this.currentHistogramY = y;}" 
          @newSchools="n => this.schoolCount = n" 
          @newName="n => this.interCommName = n" />
        <Sidebar
          :layers="layers"
          :currentLayerPath="currentLayerPath"
          :currentHistogramX="currentHistogramX"
          :currentHistogramY="currentHistogramY"
          :schoolCount="schoolCount"
          :interCommName="interCommName" />
      </section>
    </section>
  </div>
</template>

<script>
import Config from './config.json'

import Intro from './components/Intro.vue'
import Tutorial from './components/Tutorial.vue'
import About from './components/About.vue'
import ZoomControl from './components/ZoomControl.vue'
import LocationControl from './components/LocationControl.vue'
import Layers from './components/Layers.vue'
import Map from './components/Map.vue'
import Sidebar from './components/Sidebar.vue'

/** The layer that should first be loaded. */
const defaultLayerPath = Config.EV_path

export default {
  components: { Intro, Tutorial, About, ZoomControl, LocationControl, Layers, Map, Sidebar },

  data: () => ({
    layers: Object.keys(Config.layers).reduce((m, layerPath) => {
      m[layerPath] = Config.layers[layerPath]
      m[layerPath].loaded = false
      m[layerPath].path = layerPath
      return m
    }, {}),

    isFuture: false,
    currentLayerPath: defaultLayerPath,

    currentZoom: 0,
    currentLocation: null,
    currentHistogramX: null,
    currentHistogramY: null,

    introVisible: true,
    sidebarVisible: false,
    aboutVisible: false,

    currentTutorialStep: 1,

    interCommName: "",
    schoolCount: null,
  }),

  computed: {
    currentLayerLoaded() {
      return this.layers[this.currentLayerPath].loaded
    }
  },

  methods: {
    logKey(e) {
      console.log(e)
    }
  }
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

h3 {
  color: #666;
  font-size: 11pt;
  font-weight: normal;
  text-align: center;
}

h4 {
  color: #666;
  font-size: 16pt;
  font-weight: normal;
  text-align: center;
}

p, ul {
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
  text-shadow: 0 0 2px rgba(#000, .2);
  box-shadow: 0 0 2px rgba(#000, .2), inset 0 0 2px rgba(#000, .2);
  font-family: 'IBM Plex Sans', sans-serif;

  &:hover {
    padding: 9px 16px;
  }

  &.dark {
    color: #000;
    border-color: #000;
  }

  &.dark.full {
    background: #000;
    color: #fff;
  }
}

.menu {
  z-index: 500;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.horizontal-split {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.vertical-split {
  display: flex;
  flex-grow: 1;
  background: #000;
  position: relative;
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
    font-family: 'Courier New';
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

.zoom-control {
  margin-bottom: 0;
}

.about-button {
  display: block;
  text-align: center;
  height: 40px;
  width: 80px;
  line-height: 40px;
  border: 1px solid #bbb;
  border-top: 0;
  box-shadow: 0 0 3px rgba(#000, .2);
  background: #fff;
  text-transform: uppercase;
  color: #666;
  font-size: 10pt;
  text-decoration: none;
}

#espacesVerts {
  height: 300px;
  width: 100%;
  margin-top: 25px;
  margin-bottom: 5px;
}
</style>
