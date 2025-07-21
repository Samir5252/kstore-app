import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ▼▼▼ REEMPLAZA ESTO con la URL base de tu API web existente ▼▼▼
const BASE_URL = 'https://api.tu-pagina-web.com'; 

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
