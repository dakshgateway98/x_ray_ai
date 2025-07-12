import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // This will be proxied by Vite
  timeout: 10000, // 10 second timeout
});

export default api; 