import VueInstance from '../main'

const defaultState = () => {
  return {
    status: '',
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('meduser')) || ''
  };
};

let state = defaultState();

const mutations = {
  auth_request(state) {
    state.status = 'loading';
  },
  auth_success(state, token, user) {
    state.status = 'success',
    state.token = token,
    state.user = user
  },
  auth_error(state) {
    state.status = 'error'
  },
  logout(state) {
    state.status = '',
    state.token = ''
  }
};

const actions = {
  login(context, usr) {
    return new Promise((resolve, reject) => {
      context.commit('auth_request');
      VueInstance.$axios({url: 'http://localhost:6400/login', data: usr, method: 'POST'})
      .then(response => {
        const token = response.data.token;
        const user = JSON.stringify(response.data.user);
        localStorage.setItem('meduser', user);
        localStorage.setItem('token', token);
        VueInstance.$axios.defaults.headers.common['Authorization'] = token;
        context.commit('auth_success', token, JSON.parse(user));
        resolve(response);
      })
      .catch(err => {
        context.commit('auth_error');
        localStorage.removeItem('meduser');
        localStorage.removeItem('token');
        reject(err);
      })
    });
  },
  logout(context){
    return new Promise((resolve, reject) => {
      console.log('Logging out')
      try {
        context.commit('logout')
        localStorage.removeItem('meduser');
        localStorage.removeItem('token')
        delete VueInstance.$axios.defaults.headers.common['Authorization']
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  },
  refresh(context, requestData){
    return new Promise((resolve, reject) => {

      VueInstance.$axios({
        url: "http://localhost:6400/healthofficial",
        data: requestData,
        headers: { Authorization: context.state.token },
        method: "POST",
      })
      .then(response => {
        const user = JSON.stringify(response.data.data);
        localStorage.setItem('meduser', user);
        context.commit('auth_success', context.state.token, JSON.parse(user));
        resolve(response);
      })
      .catch(err => {
        context.commit('auth_error');
        localStorage.removeItem('meduser');
        localStorage.removeItem('token');
        reject(err);
      });
    });
  }
};

const getters = {
  isLoggedIn: state => !!state.token,
  authStatus: state => state.status,
  getUser: state => state.user,
  authToken: state => state.token || null
};

export default {
  state,
  mutations,
  actions,
  getters
}