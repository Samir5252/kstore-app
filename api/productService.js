import client from './client';

// La función ahora acepta un objeto con todos los posibles parámetros
export const getProducts = (params) => {
  // params puede ser { page: 1, category: 'all', price: '500', search: 'bts' }
  return client.get('/api/products', { params });
};