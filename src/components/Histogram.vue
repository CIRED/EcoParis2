<template>
  <div ref="graph" style="width:600px;height:250px;"></div>
</template>

<script>
export default {
  props: ['data'],

  mounted() {
    console.log('Initial histogram data:', this.data)
  },

  watch: {
    /**
     * Watches changes to the data prop, and updates the histogram.
     */
    data(data) {
      console.log('New histogram data:', data)
    }
  }

}
</script>
