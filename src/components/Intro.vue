<template>
  <section class="intro">
    <h1>
      EcoParis
      <img src="assets/parrot.svg">
    </h1>

    <p>Découvrez l'influence de la nature sur votre vie à Paris.</p>

    <section class="buttons">
      <a v-if="isLoading" class="button loading">Chargement</a>
      <a v-else @click.prevent="onDismiss" href="#" class="button">Commencer la visite</a>
    </section>
  </section>
</template>

<script>
export default {
  props: ['onDismiss', 'isLoading']
}
</script>

<style lang="scss" type="text/scss">
.intro {
  z-index: 1001;
  position: fixed;
  display: flex;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  color: #fff;
  background: linear-gradient(120deg, rgba(#84fab0, .98) 10%, rgba(#8fd3f4, .98) 100%);
}

.intro.fade-enter-active, .intro.fade-leave-active {
  transition: opacity .3s;
}

.intro.fade-enter, .intro.fade-leave-to {
  opacity: 0;
}

.intro h1, .intro p {
  text-shadow: 0 0 2px rgba(0, 0, 0, .4);
}

.intro h1 {
  font-family: 'Cedarville Cursive';
  font-size: 38pt;
  margin: 0 0 -.3rem;
  position: relative;
}

.intro h1 img {
  position: absolute;
  width: 64px;
  top: -8px;
  right: -30px;
}

.intro p {
  font-size: 21pt;
  margin: 0;
}

.intro .buttons {
  margin-top: 50px;
}

.intro .button {
  margin-left: 10px;
  margin-right: 10px;
}

.intro .button.loading {
  cursor: not-allowed;

  &:before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    background: rgba(#fff, .2);
    animation: loading 4s infinite ease-in-out;
  }
}

@keyframes loading {
  0% {
    left: 0;
    width: 0%;
  }

  50% {
    left: 0;
    width: 100%;
  }

  100% {
    left: 100%;
    width: 0%;
  }
}
</style>
