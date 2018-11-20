<template>
  <section class="sidebar">
    <h2>What is phosphorus?</h2>
    <DemoChart />
    <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p>
  </section>
</template>

<script>
import DemoChart from './DemoChart.vue'

export default {
  components: { DemoChart }
}
</script>

<style lang="scss" type="text/scss">
.sidebar {
  z-index: 500;
  width: 450px;
  max-width: 30%;
  box-sizing: border-box;
  padding: 40px;
  text-align: justify;

  background: #fff;
  box-shadow: 0 0 2px rgba(0, 0, 0, .3);
  overflow: auto;
}

.sidebar h2 {
  margin-top: 0;
}
</style>
