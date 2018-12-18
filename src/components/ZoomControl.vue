<template>
  <section class="zoom-control">
    <a class="minus" @click.prevent="$emit('zoomOut')">-</a>
    <a class="plus" @click.prevent="$emit('zoomIn')">+</a>
  </section>
</template>

<script>
export default {}
</script>

<style lang="scss" type="text/scss">
.zoom-control {
  width: 80px;

  a {
    cursor: pointer;
  }
}
</style>