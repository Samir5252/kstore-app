import client from './client';

// Función para obtener TODAS las categorías de la API
export const getAllCategories = () => {
  // Asegúrate de que este endpoint '/api/categories' exista en tu backend
  return client.get('/api/categories');
};
