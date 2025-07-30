import React, { createContext, useState, useContext, useCallback } from 'react';
import { getCart } from '@/api/cartService';
import { useFocusEffect } from 'expo-router';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(null);
    const [itemCount, setItemCount] = useState(0);

    const fetchCart = useCallback(async () => {
        try {
            const { data } = await getCart();
            setCart(data);
            // Calculamos el número total de ítems
            const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
            setItemCount(totalItems);
        } catch (error) {
            console.error("Context Error: No se pudo obtener el carrito.", error.message);
            // Si hay un error (ej. no logueado), reseteamos el contador
            setItemCount(0);
        }
    }, []);
    
    // Usamos useFocusEffect para refrescar el carrito cada vez que se navega entre pestañas
    useFocusEffect(
        useCallback(() => {
            fetchCart();
        }, [fetchCart])
    );

    return (
        <CartContext.Provider value={{ cart, itemCount, fetchCart }}>
            {children}
        </CartContext.Provider>
    );
};

// Hook personalizado para usar el contexto fácilmente
export const useCart = () => useContext(CartContext);
