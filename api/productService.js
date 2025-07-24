import client from './client';

// La función ahora acepta un número de página
export const getAllProducts = (page = 1) => {
  // Pasamos el número de página como un parámetro en la URL
  return client.get(`/api/products?page=${page}`);
};