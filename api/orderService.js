import client from './client'; // ✅ Importamos el cliente central de Axios
/**
 * Obtiene el historial de órdenes del usuario logueado.
 */
export const getMyOrders = () => {
  return client.get('api/orders/my-orders');
};
