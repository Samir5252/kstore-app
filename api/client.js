// Este archivo es NUEVO. Debes crearlo en tu proyecto de React Native.
// Generalmente se ubica en una carpeta como 'src/api/' o similar.

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reemplaza esta URL con la dirección de tu backend.
// Si pruebas en un dispositivo Android físico, usa la IP de tu computadora.
// Ejemplo: '     https://backend-production-93c8.up.railway.app   http://192.168.22.34:5000'
const API_URL = 'http://192.168.22.34:5000'; 

const client = axios.create({
    baseURL: API_URL,
});

// ▼▼▼ LÓGICA CRÍTICA: INTERCEPTOR DE PETICIONES ▼▼▼
// Esto se ejecuta ANTES de cada petición que hagas con 'client'.
client.interceptors.request.use(
    async (config) => {
        // 1. Intentamos obtener el token del almacenamiento local.
        const token = await AsyncStorage.getItem('userToken');

        // 2. Si el token existe, lo añadimos a la cabecera 'Authorization'.
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // 3. Devolvemos la configuración modificada para que la petición continúe.
        return config;
    },
    (error) => {
        // Si hay un error al configurar la petición, lo rechazamos.
        return Promise.reject(error);
    }
);

export default client;
