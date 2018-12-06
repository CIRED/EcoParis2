<template>
  <div ref="graph" class="graph-box"></div>
</template>

<script>
export default {
  props: ['data'],

  mounted() {
    Plotly.newPlot(this.$refs.graph, [{
      x: this.data,
      type: 'histogram',
    }])
  },

  watch: {
    /**
     * Watches changes to the data prop, and updates the histogram.
     */
    data(data) {
      Plotly.react(this.$refs.graph, [{
        x: this.data,
        type: 'histogram',
      }])
    }
  }
}
</script>

<style lang="scss" type="text/scss">
.graph-box {
  height: 300px;
}
</style>