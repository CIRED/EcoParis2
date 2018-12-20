<template>
  <section class="histogram">
    <svg ref="svg"></svg>
  </section>
</template>

<script>
import Config from '../config.json'
import helpers from '../helpers.js'

export default {
  props: ['x', 'y', 'currentLayerPath'],
  data: () => ({
    updateChart: data => {},
  }),
  
  mounted() {
    // Define the dimensions of the histogram.
    const margin = {top: 5, right: 10, bottom: 45, left: 65}
    const width = 380
    const height = 250
    const innerWidth = width - margin.left - margin.right 
    const innerHeight = height - margin.top - margin.bottom

    // Define the X and Y scales.
    const x = d3.scaleLinear().rangeRound([0, innerWidth])
    const y = d3.scaleLinear().rangeRound([innerHeight, 0])

    // Prepare the SVG element.
    const svg = d3.select(this.$refs.svg)
      .attr("width", width)
      .attr("height", height)
      .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)

    // Add the two axes.
    const xAxis = svg.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
    const yAxis = svg.append("g")

    // Add the legend.
    const yLegend = svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", 0 - (innerHeight / 2))
      .attr("y", 0 - margin.left)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "9pt")
      .style("font-style", "italic")
      .text("Nombre de points")

    const xLegend = svg.append("text")             
        .attr("transform", `translate(${innerWidth / 2} , ${height - 10})`)
        .style("text-anchor", "middle")
        .style("font-size", "9pt")
        .style("font-style", "italic")
        .text("Rechargement des nappes (en mm/an)")

    /**
     * Updates the histogram using new data for the bars.
     */
    this.updateChart = (xData, yData) => {
      const data = xData.map((x, i) => ({x, y: yData[i]}))
      
      // Define a "layer scale", which maps values on the X axis
      // to the real values according to the current layer's scale.
      const currentLayer = Config.layers[this.currentLayerPath]
      const layerScale = d3.scaleLinear()
        .domain([0, 255])
        .range([currentLayer.min_value, currentLayer.max_value])

      // Also define a "color scale", so that the bars in the
      // histogram can have the same color as in the legend.
      const colorScale = d3.scale.linear()
        .range(helpers.getColorsFromScheme(currentLayer.colorScheme))
        .domain(xData)

      // Update the legend text.
      xLegend.text(currentLayer.hist_legend)

      // Find the x and y minimums and maximums.
      const nonZero = xData.filter(x => yData[x] > 0)
      const xMin = nonZero[0]
      const xMax = nonZero.slice(-1)[0]
      const yMax = d3.max(yData)

      // Apply the domains to the scales.
      const xs = x.domain([xMin, xMax])
      const ys = y.domain([0, yMax])

      // Update the axes.
      xAxis.call(
        d3.axisBottom(xs)
          .ticks(5)
          .tickFormat(t => Math.round(layerScale(t) * 1000) / 1000))
      yAxis.call(d3.axisLeft(ys))

      // Update the bars.
      const bars = svg.selectAll("rect")
        .data(data, d => d.x)
      bars
        .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", 1)
        .merge(bars)
          .attr("transform", d => `translate(${xs(d.x)}, ${ys(d.y)})`)
          .attr("width", d => Math.ceil(innerWidth / (xMax - xMin)) + 1)
          .attr("height", d => innerHeight - ys(d.y))
          .attr("fill", d => colorScale(d.x))
        .exit()
          .remove()
    }

    this.updateChart(this.x, this.y)
  },

  watch: {
    /**
     * Watches changes to the x prop, and updates the histogram.
     */
    x() {
      this.updateChart(this.x, this.y)
    }
  }
}
</script>

<style>
.histogram {
  margin-left: -10px;
  margin-right: -10px;
}

.histogram svg {
  display: block;
  margin: 0 auto;
}
</style>
