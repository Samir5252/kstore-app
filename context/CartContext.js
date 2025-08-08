import React, { createContext, useState, useContext, useCallback } from 'react';
import { getCart } from '@/api/cartService';
import { useFocusEffect } from 'expo-router';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(null);
    const [itemCount, setItemCount] = useState(0);
    const [loading, setLoading] = useState(true); // <-- NUEVO ESTADO DE CARGA

    const fetchCart = useCallback(async () => {
        setLoading(true); // Inicia la carga
        try {
            const { data } = await getCart();
            setCart(data);
            const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
            setItemCount(totalItems);
        } catch (error) {
            console.error("Context Error: No se pudo obtener el carrito.", error.message);
            // Si hay un error (ej. no logueado), reseteamos todo
            setCart(null); // <-- IMPORTANTE: Limpiar el carrito
            setItemCount(0);
        } finally {
            setLoading(false); // Termina la carga
        }
    }, []);
    
    // Este hook se asegura de que el carrito se actualice al navegar
    useFocusEffect(
        useCallback(() => {
            fetchCart();
        }, [fetchCart])
    );

    // Exponemos el estado de carga junto con los demás valores
    return (
        <CartContext.Provider value={{ cart, itemCount, loading, fetchCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);