import axios from 'axios';

const axiosInstance = axios.create({
  baseUrl: 'http://localhost:6400/'
});
// eslint-disable-next-line
NProgress.configure({ minimum: 0.4, easing: 'ease', speed: 1500, showSpinner: false });

// before a request is made start the nprogress
axiosInstance.interceptors.request.use(config => {
  // eslint-disable-next-line
  NProgress.start()
  return config
}, err => {
  // eslint-disable-next-line
  NProgress.done()
  return Promise.reject(err)
})

// before a response is returned stop nprogress
axiosInstance.interceptors.response.use(response => {
  // eslint-disable-next-line
  NProgress.done()
  return response
}, err => {
  // eslint-disable-next-line
  NProgress.done()
  return Promise.prototype.reject(err)
})

export { axiosInstance };