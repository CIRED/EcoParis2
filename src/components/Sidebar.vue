<template>
  <section class="sidebar">
    <div v-if="currentLayer == 'data/p_export.json'">
      <h2>Mesure de la rétention de phosphore.</h2>
      <p>Le service de rétention du phosphore permet d'améliorer la qualité de l'eau (superficielle et souterraine). Il est directement utile aux organismes de gestion de l'eau (syndicats et département d'assainissement), et donc aux habitants dont les impôts financent la maintenance des services d'assainissement.</p>

      <Histogram :data="histData" />
    </div>

    <div v-if="currentLayer == 'data/n_export.json'">
      <h2>Mesure de la rétention de l'azote.</h2>
      <p>Le service de rétention de l'azote permet d'améliorer la qualité de l'eau (superficielle et souterraine). Il est directement utile aux organismes de gestion de l'eau (syndicats et département d'assainissement), et donc aux habitants dont les impôts financent la maintenance des services d'assainissement.</p>

      <Histogram :data="histData" />
    </div>
  </section>
</template>

<script>
import Histogram from './Histogram.vue'

export default {
  props: ['currentLayer', 'histData'],
  components: { Histogram }
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
