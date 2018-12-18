<template>
  <section class="zoom-control">
    <a class="minus" @click.prevent="onZoomMinus">-</a>
    <a class="plus" @click.prevent="onZoomPlus">+</a>
  </section>
</template>

<script>
export default {
  props: ['onZoomMinus', 'onZoomPlus']
}
</script>

<style lang="scss" type="text/scss">
.zoom-control {
  width: 80px;

  a {
    cursor: pointer;
  }
}
</style>