<template>
  <section class="layers">
    <h3>Couches</h3>

    <div class="buttons">
      <a v-for="layer in BrowsableLayers"
        :class="{ active: value == layer.path }"
        @click.prevent="select(layer)">
        <span class="icon" v-html="layer.icon"></span>
        <span>{{ layer.name }}</span>

        <div v-if="!layer.loaded" class="loader-tile-grid">
          <div class="loader-tile loader-tile1"></div>
          <div class="loader-tile loader-tile2"></div>
          <div class="loader-tile loader-tile3"></div>
          <div class="loader-tile loader-tile4"></div>
          <div class="loader-tile loader-tile5"></div>
          <div class="loader-tile loader-tile6"></div>
          <div class="loader-tile loader-tile7"></div>
          <div class="loader-tile loader-tile8"></div>
          <div class="loader-tile loader-tile9"></div>
        </div>
      </a>
    </div>
  </section>
</template>

<script>
import _ from 'lodash';

export default {
  props: ['layers', 'value'],

  methods: {
    select(layer) {
      if (!layer.loading) {
        this.$emit('input', layer)
      }
    }
  },
  computed: {
    BrowsableLayers: function() {
      return _.pickBy(this.layers, function(u) {
        return !u.hidden;
      });
    } //contains only layers that should be browsable (not "Espaces verts"!)
  }
}
</script>

<style lang="scss" type="text/scss">
.layers {
  max-height: 600px;
  height: 80%;
  width: 80px;
  border: 1px solid #bbb;
  box-shadow: 0 0 3px rgba(#000, .2);
  background: #fff;
  display: flex;
  flex-direction: column;
}

.layers h3, .layers a {
  text-transform: uppercase;
}

.layers h3 {
  width: 100%;
  margin: 0;
  padding: 7px 0;
  color: #666;
  font-size: 11pt;
  font-weight: normal;
  text-align: center;
}

.layers .buttons {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.layers a {
  display: flex;
  position: relative;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  outline: none;
  cursor: pointer;

  height: 80px;
  text-decoration: none;
  border-bottom: 1px solid #bbb;
  color: #333;
  font-size: 10pt;

  &.active {
    background: #f3f3f3;
    box-shadow: inset 0 0 2px rgba(0, 0, 0, .1);
  }

  &:first-child {
    border-top: 1px solid #bbb;
  }

  .icon {
    font-size: 1rem;
    margin-bottom: 3px;
  }
}

// Source: http://tobiasahlin.com/spinkit/
.loader-tile-grid {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  cursor: not-allowed;
}

.loader-tile-grid .loader-tile {
  width: 33%;
  height: 33%;
  background-color: #fff;
  float: left;

  animation: loader-tileGridScaleDelay 1.3s infinite ease-in-out;
}

.loader-tile-grid .loader-tile1 { animation-delay: 0.2s; }
.loader-tile-grid .loader-tile2 { animation-delay: 0.3s; }
.loader-tile-grid .loader-tile3 { animation-delay: 0.4s; }
.loader-tile-grid .loader-tile4 { animation-delay: 0.1s; }
.loader-tile-grid .loader-tile5 { animation-delay: 0.2s; }
.loader-tile-grid .loader-tile6 { animation-delay: 0.3s; }
.loader-tile-grid .loader-tile7 { animation-delay: 0s; }
.loader-tile-grid .loader-tile8 { animation-delay: 0.1s; }
.loader-tile-grid .loader-tile9 { animation-delay: 0.2s; }

@keyframes loader-tileGridScaleDelay {
  0%, 70%, 100% {
    transform: scale3D(1, 1, 1);
  } 35% {
    transform: scale3D(0, 0, 1);
  }
}
</style>
