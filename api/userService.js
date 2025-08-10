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

// Obtiene los datos del usuario actualmente logueado
export const getCurrentUser = () => {
  // Esta ruta debe existir en tu backend (GET /api/users/me) y estar protegida
  return client.get('/api/users/me');
};

// Actualiza los datos del usuario
export const updateUser = (updateData) => {
  // Esta ruta debe existir en tu backend (PUT /api/users/me) y estar protegida
  return client.put('/api/users/me', updateData);
};

export const googleLogin = (idToken) => {
  return client.post('/api/users/google-login', { idToken });
};

// ==================================================================
// ▼▼▼ FUNCIONES AÑADIDAS PARA RECUPERAR CONTRASEÑA ▼▼▼
// ==================================================================

/**
 * Solicita al backend que envíe un código de verificación al correo del usuario.
 * @param {string} email El correo del usuario.
 */
export const forgotPasswordRequest = (email) => {
  return client.post('/api/users/forgot-password', { email });
};

/**
 * Envía el código de verificación y la nueva contraseña al backend.
 * @param {string} email El correo del usuario.
 * @param {string} code El código de 6 dígitos recibido.
 * @param {string} newPassword La nueva contraseña del usuario.
 */
export const resetPasswordWithCode = (email, code, newPassword) => {
  return client.post('/api/users/reset-password', { email, code, newPassword });
};

export const updateUserAddress = (data) => {
  // Asegúrate de que la ruta '/users/profile' exista en tu backend y acepte un método PUT
  return client.put('/api/users/me', data);
};