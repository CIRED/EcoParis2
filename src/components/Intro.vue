<template>
  <section class="intro">
    <h1>
      EcoParis
      <img src="assets/parrot.svg">
    </h1>
    <p>How nature impacts your life in Paris.</p>
    <a @click.prevent="onDismiss" href="#" class="button">Explore</a>
  </section>
</template>

<script>
export default {
  props: ['onDismiss']
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
  // background: linear-gradient(to right, rgba(#1fa2ff, .95), rgba(#12d8fa, .95), rgba(#a6ffcb, .95));
  // background: linear-gradient(to right, rgba(#4cb8c4, .95), rgba(#3cd3ad, .95));
  background: linear-gradient(to right, rgba(#56ab2f, .95), rgba(#a8e063, .95));
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
  margin: 0 0 25px;
}
</style>
