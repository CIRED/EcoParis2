<template>
  <section class="sidebar">
    <template v-if="!isEspacesVerts && currentLayerPath && layers[currentLayerPath].loaded">
      <article>
        <h2>{{ $t(`layers.${currentLayerId}.title`) }}</h2>
        <div v-html="$t(`layers.${currentLayerId}.content`)"></div>
      </article>

      <article class="contextual-info">
        <h4 v-if="interCommName">
          {{interCommName}}
        </h4>

        <h4 v-else>
          {{ $t('sidebar.whole-region') }}
        </h4>

        <p
          v-if="interCommName && schoolCount" 
          v-html="$t('sidebar.child-count', {count: schoolCount})">
        </p>

        <Histogram
          :x="currentHistogramX"
          :y="currentHistogramY"
          :currentLayerPath="currentLayerPath" />
      </article>
    </template>

    <template v-else>
      <article>
        <h2>{{ $t('intro.title') }}</h2>
        <p v-html="$t('intro.about')"></p>
        <p v-html="$t('intro.start')"></p>
        <p v-html="$t('intro.future')"></p>
      </article>

      <article class="about">
        <p v-html="$t('intro.credits')"></p>

        <section class="slideshow">
          <a href="https://www.epfl.ch/">
            <img src="assets/epfl.png" alt="Logo EPFL">
          </a>
          <a href="https://naturalcapitalproject.stanford.edu/">
            <img src="assets/natcap.jpg" alt="Logo NatCap">
          </a>
        </section>
      </article>
    </template>
  </section>
</template>

<script>
import Config from '../config.json'
import Histogram from './Histogram.vue'

export default {
  props: ['layers', 'currentLayerPath', 'currentHistogramX', 'currentHistogramY', 'schoolCount', 'interCommName'],
  components: { Histogram },
  computed: {
    isEspacesVerts() {
      return this.currentLayerPath == Config.EV_path;
    },

    currentLayerId() {
      return Config.layers[this.currentLayerPath].id
    }
  }
}
</script>

<style lang="scss" type="text/scss">
.sidebar {
  z-index: 500;
  width: 460px;
  max-width: 30%;
  box-sizing: border-box;
  padding: 35px;
  font-size: 0.94em;

  background: #fff;
  box-shadow: 0 0 2px rgba(0, 0, 0, .3);
  overflow: auto;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sidebar .contextual-info {
  position: relative;
  padding: 10px 0 0;

  &::before {
    content: '';
    position: absolute;
    display: block;
    border-top: 1px solid #e9e9e9;
    left: -35px;
    right: -35px;
    top: 0;
  }

  h4 {
    font-size: .9em;
    font-variant-caps: small-caps;
  }
}

.sidebar p {
  margin: 30px 0;
}

.sidebar ul {
  margin-bottom: 30px;
}

.sidebar h2 {
  margin-top: 0;
  letter-spacing: -1px;
  font-size: 1.25em;
}

.sidebar .about {
  font-style: italic;
}

.sidebar .slideshow {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  margin: 40px 0 20px;

  a {
    height: 90px;
  }

  img {
    height: 100%;
  }
}

.sidebar .button {
  margin: 5px 0 10px;
  font-size: 0.85em;
  display: inline-block;
}
</style>
