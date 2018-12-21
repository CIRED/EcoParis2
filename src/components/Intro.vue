<template>
  <section class="intro">
    <h1>
      EcoParis
      <img src="assets/parrot.svg">
    </h1>

    <p>Découvrez l'influence de la nature sur votre vie à Paris.</p>

    <section class="buttons">
      <a v-if="isLoading" class="button loading">Chargement</a>
      <template v-else>
        <a @click.prevent="startFrench" href="#" class="button"><i class="flag-icon flag-icon-fr"></i> Commencer la visite</a>
        <a @click.prevent="startEnglish" href="#" class="button"><i class="flag-icon flag-icon-us"></i> Get started</a>
      </template>
    </section>
  </section>
</template>

<script>
export default {
  props: ['isLoading'],
  methods: {
    startFrench() {
      this.$i18n.locale = 'fr'
      this.$emit('dismiss')
    },
    startEnglish() {
      this.$i18n.locale = 'en'
      this.$emit('dismiss')
    }
  }
}
</script>

<style lang="scss">
/** Flags from https://github.com/lipis/flag-icon-css. **/
$flag-path: '../../public/assets';

.flag-icon-background {
  background-size: contain;
  background-position: 50%;
  background-repeat: no-repeat;
}

.flag-icon {
  @extend .flag-icon-background;
  position: relative;
  display: inline-block;
  width: 1em;
  margin-right: 0.4em;
  line-height: 1em;
  border-radius: 3px;
  &:before {
    content: '\00a0';
  }
}

@mixin flag-icon($country) {
  .flag-icon-#{$country} {
    background-image: url(#{$flag-path}/flag-#{$country}.svg);
  }
}

@include flag-icon('fr');
@include flag-icon('us');

/** Introduction page. **/
.intro {
  z-index: 2000;
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
