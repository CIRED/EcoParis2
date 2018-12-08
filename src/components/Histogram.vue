<template>
  <div ref="graph" class="graph-box"></div>
</template>

<script>
/**
 * Updates the Plotly plot according to this.data.
 */
const updatePlot = (that) =>
  Plotly.react(that.$refs.graph, [{
    x: that.data,
    type: 'histogram',
  }], {
    margin: {
      l: 35,
      r: 35,
      t: 5,
      b: 20,
    },
  }, {
    displayModeBar: false,
  })

export default {
  props: ['data'],

  mounted() {
    updatePlot(this)
  },

  watch: {
    /**
     * Watches changes to the data prop, and updates the histogram.
     */
    data() {
      updatePlot(this)
    }
  }
}
</script>

<style lang="scss" type="text/scss">
.graph-box {
  height: 300px;
}
</style>