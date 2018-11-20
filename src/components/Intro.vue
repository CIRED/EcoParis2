<template>
  <section class="intro">
    <h2>EcoParis</h2>
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
  background: linear-gradient(to right, rgba(#4e54c8, .95), rgba(#8f94fb, .95));
}

.intro.fade-enter-active, .intro.fade-leave-active {
  transition: opacity .3s;
}

.intro.fade-enter, .intro.fade-leave-to {
  opacity: 0;
}

.intro h2 {
  margin-bottom: -.3rem;
}

.intro p {
  margin-bottom: .8rem;
}
</style>
