<template>
  <section class="sidebar">
    <div v-if="currentLayerPath && layers[currentLayerPath].loaded && !isEspacesVerts">
      <h2>{{ layers[currentLayerPath].title }}</h2>
      <div v-html="layers[currentLayerPath].content"></div>


      <p v-if="isCorrelation">
      Formule: (P<sub>n</sub> + Nu<sub>n</sub> + Na<sub>n</sub> + T<sub>n</sub>) &frasl; 4</sub>
        <ul>
          <li> Pollinisation: P<sub>n</sub> = P &frasl; max(P) </li>
          <li> Rét. nutriment: Nu<sub>n</sub> = Nu &frasl; max(Nu) </li>
          <li> Recharge des nappes: Na<sub>n</sub> = Na &frasl; max(Na) </li>
          <li> Rafraîchissement: T<sub>n</sub> = T &frasl; max(T) </li>
        </ul>
      </p>

      <Histogram
        v-if="!isEspacesVerts"
        :x="currentHistogramX"
        :y="currentHistogramY"/>

        <p v-if="schoolCount">Il y a {{ schoolCount }} établissements scolaires dans la région sélectionnée.</p>
    </div>

    <div v-else class="split">
      <article>
        $$x^2 = \frac{n^2+n}{2}$$
        <h2>Bienvenue sur EcoParis.</h2>

        <p>EcoParis est une visualisation interactive des données cartographiques des services écosystémiques en territoires urbains et péri-urbains en région Ile-de-France issues du projet <a href="https://idefese.wordpress.com/">IDEFESE</a>.</p>

        <p>Pour commencer, vous pouvez sélectionner une couche à afficher parmi des mesures de rétention d'azote, des mesures de réduction de la température due à la végétation ou encore d'indice écologique des régions.</p>

        <p>Vous pouvez aussi choisir d'afficher l'évolution estimée de ces mesures à l'horizon 2030 dans un scénario de changement climatique.</p>
      </article>

      <article class="about">
        <p>EcoParis a été conçu par des élèves du cours de <a href="https://edu.epfl.ch/coursebook/en/data-visualization-COM-480">Data Visualization</a> de l'EPFL, avec l'aide de Perrine Hamel du projet <a href="https://naturalcapitalproject.stanford.edu/">Natural Capital Project</a> de Stanford.</p>

        <section class="slideshow">
          <a href="https://www.epfl.ch/">
            <img src="assets/epfl.png" alt="Logo EPFL">
          </a>
          <a href="https://naturalcapitalproject.stanford.edu/">
            <img src="assets/natcap.jpg" alt="Logo NatCap">
          </a>
        </section>
      </article>
    </div>
  </section>
</template>

<script>
import Config from '../config.json'
import Histogram from './Histogram.vue'

export default {
  props: ['layers', 'currentLayerPath', 'currentHistogramX', 'currentHistogramY', 'schoolCount'],
  components: { Histogram },
  computed: {
    isEspacesVerts() {
      return this.currentLayerPath == Config.EV_path;
    },
    isCorrelation(){
      return this.currentLayerPath == Config.Correlation;
    }
  }
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

.sidebar .button {
  color: #000;
  border-color: #000;
  box-shadow: none;
  text-shadow: none;
  margin: 5px 0 20px;
  font-size: 0.8em;
  display: inline-block;
}


</style>
