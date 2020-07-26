import Vue from 'vue'
import Vuex from 'vuex'
// import VuexPersist from 'vuex-persist'

import userstore from './user'

Vue.use(Vuex)

// const vuexSessionStorage = new VuexPersist({
//   key: 'state',
//   storage: window.SessionStorage
// })

export default new Vuex.Store({
  modules: {
    userstore
  },
  // plugins: [vuexSessionStorage.plugin],
  // enable strict mode (adds overhead!)
  // for dev mode only
  strict: process.env.DEV
})
