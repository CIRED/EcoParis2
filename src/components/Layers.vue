<template>
  <section class="layers">
    <h3>Layers</h3>

    <div class="buttons">
      <a href="#" class="active">
        <span>P</span>
        Phosph.
      </a>

      <a href="#">
        <span>N</span>
        Nitrog.
      </a>
    </div>
  </section>
</template>

<script>
export default {}
</script>

<style lang="scss" type="text/scss">
.layers {
  max-height: 600px;
  height: 80%;
  width: 80px;
  box-shadow: 0 0 3px rgba(#8e61ca, .8);
  border: 1px solid #8e61ca;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.layers h3, .layers a {
  text-transform: uppercase;
}

.layers h3 {
  width: 100%;
  margin: 0;
  padding: 7px 0;
  color: #8e61ca;
  font-size: 12pt;
  font-weight: normal;
  text-align: center;
}

.layers .buttons {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.layers a {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  height: 80px;
  text-decoration: none;
  border-bottom: 1px solid #bbb;
  color: #333;
  font-size: 10pt;

  &.active {
    color: #fff;
    background: #8e61ca;
    box-shadow: inset 0 0 2px rgba(0, 0, 0, .2);
  }

  &:first-child {
    border-top: 1px solid #bbb;
  }

  span {
    font-size: 1rem;
    margin-bottom: 3px;
  }
}
</style>
