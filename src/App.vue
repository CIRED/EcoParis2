<template>
  <div id="app">
    <transition name="fade">
      <Intro v-if="introVisible" :onDismiss="() => introVisible = false" />
    </transition>

    <section class="menu">
      <ZoomControl />
      <Layers />
    </section>
    <section class="container">
      <Map />
      <Sidebar />
    </section>
  </div>
</template>

<script>
import Intro from './components/Intro.vue'
import ZoomControl from './components/ZoomControl.vue'
import Layers from './components/Layers.vue'
import Map from './components/Map.vue'
import Sidebar from './components/Sidebar.vue'

export default {
  data: () => ({
    introVisible: true,
    sidebarVisible: false,
  }),

  components: { Intro, ZoomControl, Layers, Map, Sidebar }
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
</style>
