import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // 3000 (Backend)
});

export default api;