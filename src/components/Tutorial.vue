<template>
  <section class="tutorial">
    <p v-html="currentStepHtml"></p>

    <a href="#" @click.prevent="close" class="button dark"><span class="keycap">ESC</span> {{ $t("skip") }}</a>
    <a v-if="value < 12" href="#" @click.prevent="next" class="button dark full"><span class="keycap">&rarr;</span> {{ $t("next") }}</a>
  </section>
</template>

<script>
/**
 * Handles key presses to ESC, ← and →.
 */
function onKeyUp(e) {
  if (e && (e.which || e.keyCode) == 37) {
    this.prev()
  } else if (e && (e.which || e.keyCode) == 39) {
    this.next()
  } else if (e && (e.which || e.keyCode) == 27) {
    this.close()
  }
}

export default {
  props: ['value', 'currentLayerPath'],

  mounted() {
    // We have to register an event listener on the body to catch all keys.
    document.body.addEventListener('keyup', onKeyUp.bind(this))
  },

  beforeDestroy() {
    // Don't forget to remove the event listener before destroying the component.
    document.body.removeEventListener('keypress', onKeyUp.bind(this))
  },

  methods: {
    prev() {
      if (this.value > 1) {
        this.$emit('input', this.value - 1)
      }
    },

    next() {
      if (this.value == 5) {
        // On step 5, going to the next step is equivalent to changing the layer to "Nappe".
        this.$emit('layerChange', 'data/rasters/L_ref.json')
      } else if (this.value == 11) {
        // On step 11, going to the next step is equivalent to changing the layer to "Hotspots".
        this.$emit('layerChange', 'data/rasters/correlation_ref.json')
      } else if (this.value == 12) {
        // Step 12 is the last step.
        this.close()
      } else {
        this.$emit('input', this.value + 1)
      }
    },

    close() {
      this.$emit('input', null)
    },
  },

  computed: {
    currentStepHtml() {
      return this.$t(`tutorial.${this.value || 12}`)
    }
  },

  watch: {
    currentLayerPath(path) {
      if (this.value == 5 && path == 'data/rasters/L_ref.json') {
        // Go to step 6 if we were in step 5 and the "Nappe" layer was chosen.
        this.$emit('input', 6)
      } else if (this.value == 11 && path == 'data/rasters/correlation_ref.json') {
        // Go to step 12 if we were in step 11 and the "Hotspots" layer was chosen.
        this.$emit('input', 12)
      }
    }
  },
}
</script>

<style lang="scss">
#app:before {
  content: '';
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 550;
  background: rgba(#000, .4);
}

#app.tutorial-null:before {
  display: none;
}

.keycap {
  display: inline-block;
  border: 1px solid #000;
  padding: 2px 4px;
  font-size: 0.8em;
  line-height: 1em;
  border-radius: 5px;
  margin: 0 5px;
}

.tutorial {
  display: flex;
  flex-shrink: 0;
  z-index: 1500;
  align-items: center;
  background: #fff;
  box-shadow: 0 2px 4px rgba(#000, .2);
  height: 68px;
  box-sizing: border-box;
  padding: 0 20px;

  transition: margin-top .5s, visibility 1s;

  .tutorial-null & {
    margin-top: -70px;
    visibility: hidden;
  }
}

.tutorial p {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.85em;
  flex-grow: 1;
  text-align: center;
  margin: 0;
}

.tutorial .button {
  font-size: 0.85em;
  margin: 0;
  margin-left: 15px;
  flex-shrink: 0;
  text-align: center;

  .keycap {
    margin: 0 10px 0 0;
  }

  &:last-child .keycap {
    position: relative;
    border-color: #fff;
    padding-top: 1px;
    padding-bottom: 3px;
    top: -2px;
  }
}

@mixin cover($rt: -1px, $rl: -1px, $rr: -1px, $rb: -1px) {
  content: '';
  display: block;
  position: absolute;
  top: $rt;
  left: $rl;
  right: $rr;
  bottom: $rb;
}

/** Highlights for the different steps. */
.tutorial-2 .map {
  z-index: 1000;
  position: relative;

  &:before {
    @include cover;
    z-index: 10001;
    box-shadow: inset 0 0 100px rgba(#000, .3);
  }
}

.tutorial-3 .legend {
  z-index: 1000;
  box-shadow: 0 0 4px rgba(#000, .3);
}

.tutorial-4 .menu {
  z-index: 1000;
  
  .zoom-control, .location-control, .layers {
    box-shadow: 0 0 4px rgba(#000, .3);
  }
}

.tutorial-5 .menu {
  z-index: 1000;

  .layers, .location-control, .zoom-control, .about-button {
    position: relative;

    &:before {
      z-index: 1100;
      @include cover;
      background: rgba(#000, .4);
    }
  }

  .layers [title="data/rasters/L_ref.json"] {
    z-index: 1500;
    background: #fff;
  }
}

.tutorial-6 .sidebar {
  z-index: 1000;
}

.tutorial-7 .year {
  z-index: 1000;
  box-shadow: 0 0 4px rgba(#000, .3);
}

#app.tutorial-8:before {
  display: none;
}

#app.tutorial-9:before {
  display: none;
}

#app.tutorial-10:before {
  display: none;
}

.tutorial-11 .menu {
  z-index: 1000;

  .layers, .location-control, .zoom-control, .about-button {
    position: relative;

    &:before {
      z-index: 1100;
      @include cover;
      background: rgba(#000, .4);
    }
  }

  .layers [title="data/rasters/correlation_ref.json"] {
    z-index: 1500;
    background: #fff;
  }
}

#app.tutorial-12:before {
  display: none;
}

</style>
