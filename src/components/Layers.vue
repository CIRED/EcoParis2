<template>
  <section class="layers">
    <h3>Layers</h3>

    <div class="buttons">
      <a v-for="layer in layers"
        :class="{ active: value == layer.path }"
        @click.prevent="select(layer)">
        <span v-html="layer.icon"></span>
        {{ layer.name }}
      </a>
    </div>
  </section>
</template>

<script>
import Config from '../config.json'

export default {
  props: ['value'],

  data: () => ({
    layers: Config.layers.map(layer => ({
      'name': layer.name,
      'path': layer.path,
      'icon': layer.icon,
      'loading': false,
    }))
  }),

  methods: {
    select(layer) {
      if (!layer.loading) {
      console.log(layer.path)
        this.$emit('input', layer.path)
      }
    }
  }
}
</script>

<style lang="scss" type="text/scss">
.layers {
  max-height: 600px;
  height: 80%;
  width: 80px;
  border: 1px solid #bbb;
  box-shadow: 0 0 3px rgba(#000, .2);
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
  color: #666;
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
  outline: none;
  cursor: pointer;

  height: 80px;
  text-decoration: none;
  border-bottom: 1px solid #bbb;
  color: #333;
  font-size: 10pt;

  &.active {
    color: #fff;
    background: #6b79ca;
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
