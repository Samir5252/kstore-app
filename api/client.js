import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL base de tu API (sin /api al final)
const BASE_URL = 'http://192.168.100.18:5000'; 

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