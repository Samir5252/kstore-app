import client from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as atob } from 'base-64'; // Necesario para decodificar el token JWT

// Helper para obtener el userId del token JWT
const getUserIdFromToken = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return null;
        // Decodificamos la parte del medio (payload) del token
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id; // Asumimos que el ID está en el campo 'id'
    } catch (error) {
        console.error("Error al decodificar el token:", error);
        return null;
    }
};

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
