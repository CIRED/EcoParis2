import Vue from 'vue'
import VueI18n from 'vue-i18n'
import App from './App.vue'

// Load the translation locales.
import fr from './locales/fr.json'
import en from './locales/en.json'

Vue.config.productionTip = false
Vue.use(VueI18n)

new Vue({
  render: h => h(App),
  i18n: new VueI18n({
    locale: 'fr',
    messages: {fr, en},
  }),
}).$mount('#app')
