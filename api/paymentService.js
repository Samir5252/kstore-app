import client from './client';

export const createPaypalOrder = (cartId, deliveryMethod) => {
  // Apunta a la ruta correcta que usa tu controlador de órdenes
  return client.post('/api/orders/create-paypal-order', { cartId, deliveryMethod });
};

export const capturePaypalOrder = (paypalOrderId, cartId, deliveryMethod) => {
  // Apunta a la ruta correcta que usa tu controlador de órdenes
  return client.post('/api/orders/capture-order', { paypalOrderId, cartId, deliveryMethod });
};