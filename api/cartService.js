import client from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as atob } from 'base-64';

// Helper para obtener el userId del token JWT
const getUserIdFromToken = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return null;
        
        const payload = JSON.parse(atob(token.split('.')[1]));

        // ▼▼▼ CORRECCIÓN IMPORTANTE AQUÍ ▼▼▼
        // Ahora buscamos el ID dentro del objeto 'user' anidado,
        // tal como lo genera tu nuevo controlador.
        return payload.user.id; 

    } catch (error) {
        console.error("Error al decodificar el token:", error);
        return null;
    }
};

// --- El resto de las funciones no necesitan cambios ---

// Obtener el carrito del usuario logueado
export const getCart = async () => {
    const userId = await getUserIdFromToken();
    if (!userId) throw new Error("Usuario no autenticado");
    return client.get(`/api/cart/${userId}`);
};

// Añadir un ítem al carrito
export const addItemToCart = async (productId, quantity) => {
    const userId = await getUserIdFromToken();
    if (!userId) throw new Error("Usuario no autenticado");
    return client.post(`/api/cart/${userId}`, { productId, quantity });
};

// Eliminar un ítem del carrito
export const removeItemFromCart = async (itemId) => {
    const userId = await getUserIdFromToken();
    if (!userId) throw new Error("Usuario no autenticado");
    return client.delete(`/api/cart/${userId}/item/${itemId}`);
};

// Actualizar la cantidad de un ítem en el carrito
export const updateCartItemQuantity = async (itemId, quantity) => {
    const userId = await getUserIdFromToken();
    if (!userId) throw new Error("Usuario no autenticado");
    return client.put(`/api/cart/${userId}/item/${itemId}`, { quantity });
};
