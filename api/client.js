import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL base for the API
const BASE_URL = 'https://backend-production-93c8.up.railway.app'; 

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
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

export default client;