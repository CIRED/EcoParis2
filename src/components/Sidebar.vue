<template>
  <section class="sidebar">
    <div v-if="currentLayerPath && layers[currentLayerPath].loaded && currentLayerPath != EV_path">
      <h2>{{ layers[currentLayerPath].title }}</h2>
      <div v-html="layers[currentLayerPath].content"></div>
      <Histogram v-if="currentLayerPath != EV_path" :x="currentHistogramX"
                 :y="currentHistogramY"/>
    </div>

    <div v-else class="split">
      <article>
        <h2>Bienvenue sur EcoParis.</h2>

        <p>EcoParis est une visualisation interactive des données cartographiques des services écosystémiques en territoires urbains et péri-urbains en région Ile-de-France issues du projet <a href="https://idefese.wordpress.com/">IDEFESE</a>.</p>

        <p>Pour commencer, vous pouvez sélectionner une couche à afficher parmi des mesures de rétention <a href="#">de phosphore</a> et <a href="#">d'azote</a>, des mesures de <a href="#">réduction de la température</a> due à la végétation ou encore de <a href="#">valeur économique</a> des régions.</p>

        <p>Vous pouvez aussi choisir d'afficher l'évolution estimée de ces mesures à l'horizon 2025 dans un scénario de changement climatique.</p>
      </article>

      <article class="about">
        <p>EcoParis a été conçu par des élèves du cours de <a href="https://edu.epfl.ch/coursebook/en/data-visualization-COM-480">Data Visualization</a> de l'EPFL, avec l'aide de Perrine Hamel du projet <a href="https://naturalcapitalproject.stanford.edu/">Natural Capital Project</a> de Stanford.</p>

        <section class="slideshow">
          <a href="https://www.epfl.ch/">
            <img src="https://mediacom.epfl.ch/files/content/sites/mediacom/files/EPFL-Logo.jpg" alt="Logo EPFL">
          </a>
          <a href="https://naturalcapitalproject.stanford.edu/">
            <img src="https://idefese.files.wordpress.com/2018/11/image5.jpg?w=172&h=171" alt="Logo NatCap">
          </a>
        </section>
      </article>
    </div>
  </section>
</template>

<script>
import Histogram from './Histogram.vue'

export default {
  props: ['layers', 'currentLayerPath', 'EV_path', 'currentHistogramX', 'currentHistogramY'],
  components: { Histogram },
}
</script>

<style lang="scss" type="text/scss">

#espacesVerts {
  height: 300px;
  width: 100%;
  margin-top: 25px;
  margin-bottom: 5px;
}
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

.sidebar .split {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sidebar p {
  margin: 30px 0;
}

.sidebar h2 {
  margin-top: 0;
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
</style>
