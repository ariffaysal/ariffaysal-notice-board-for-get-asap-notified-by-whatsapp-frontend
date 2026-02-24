import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:3001', 
  headers: {
    'Content-Type': 'application/json',
   
    'x-api-key': '1234567890abcdef', 
  },
});

export default api;