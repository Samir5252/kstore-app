// La importación debe ser desde './client'
import client from './client';

// Función para iniciar sesión
export const loginUser = (credentials) => {
  return client.post('/api/users/login', credentials);
};

// Función para registrar un nuevo usuario
export const registerUser = (userData) => {
  return client.post('/api/users/register', userData);
};


// ==================================================================
// ▼▼▼ FUNCIONES AÑADIDAS ▼▼▼
// ==================================================================

// Obtiene los datos del usuario actualmente logueado
export const getCurrentUser = () => {
  // Esta ruta debe existir en tu backend (GET /api/users/me) y estar protegida
  return client.get('/api/users/me');
};

// Actualiza los datos del usuario
// updateData puede ser { name: 'Nuevo Nombre' } o 
// { newEmail: 'nuevo@email.com', currentPassword: '...' }
export const updateUser = (updateData) => {
  // Esta ruta debe existir en tu backend (PUT /api/users/me) y estar protegida
  return client.put('/api/users/me', updateData);
};

