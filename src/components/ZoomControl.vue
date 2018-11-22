<template>
  <section class="zoom-control">
    <a href="#" class="minus">-</a>
    <a href="#" class="plus">+</a>
  </section>
</template>

<script>
export default {}
</script>

<style lang="scss" type="text/scss">
.zoom-control {
  height: 40px;
  width: 80px;
  margin-bottom: 20px;
  border: 1px solid #bbb;
  box-shadow: 0 0 3px rgba(#000, .2);
  background: #fff;
  display: flex;
}

.zoom-control a {
  width: 50%;
  font-family: Courier New;
  font-size: 18pt;
  line-height: 40px;
  text-align: center;
  text-decoration: none;
  color: #000;
}

.zoom-control .minus {
  border-right: 1px solid #bbb;
}
</style>
