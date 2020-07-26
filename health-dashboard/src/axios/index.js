import axios from 'axios';

const axiosInstance = axios.create({
  baseUrl: 'http://localhost:6400/'
});

export { axiosInstance };