<template>
  <div id="app">
    <transition name="fade">
      <Intro v-if="introVisible" :onDismiss="() => introVisible = false" />
    </transition>

    <section class="menu">
      <ZoomControl />
      <Layers />
    </section>
  
    <Map />
  </div>
</template>

<script>
import Intro from './components/Intro.vue'
import ZoomControl from './components/ZoomControl.vue'
import Layers from './components/Layers.vue'
import Map from './components/Map.vue'

export default {
  data: () => ({
    introVisible: true,
    sidebarVisible: false,
  }),

  components: { Intro, ZoomControl, Layers, Map }
}
</script>

<style lang="scss">
html, body {
  width: 100%;
  height: 100%;
  font-size: 23pt;
}

* {
  margin: 0;
  padding: 0;
}

#app {
  width: 100%;
  height: 100%;
  font-family: 'IBM Plex Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h2 {
  font-family: 'Cedarville Cursive';
  font-size: 1.7rem;
}

p {
  font-family: 'Crimson Text', serif;
}

.button {
  text-decoration: none;
  margin: 1.2rem;
  font-size: .6rem;
  padding: .33rem .47rem;
  border: 1px solid #fff;
  color: #fff;
  text-transform: uppercase;
  font-weight: 300;
  transition: padding .2s;
  position: relative;
  outline: none;

  &:hover {
    padding: .33rem .55rem;
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
</style>
