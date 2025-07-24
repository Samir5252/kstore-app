// La importación debe ser desde './client'
import client from './client';

// Función para iniciar sesión
export const loginUser = (credentials) => {
  return client.post('/api/users/login', credentials);
};

export const registerUser = (userData) => {
  return client.post('/api/users/register', userData);
};
