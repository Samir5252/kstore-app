import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getCart, removeItemFromCart } from '@/api/cartService';
import Svg, { Path } from 'react-native-svg';

const TrashIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></Path></Svg>;

export default function CartScreen() {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCart = useCallback(async () => {
        try {
            const { data } = await getCart();
            setCart(data);
        } catch (error) {
            console.error("Error al obtener el carrito:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // useFocusEffect para que el carrito se actualice cada vez que entras a la pestaña
    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchCart();
        }, [])
    );

    const handleRemoveItem = async (itemId) => {
        try {
            const { data } = await removeItemFromCart(itemId);
            setCart(data); // Actualizamos el estado del carrito con la respuesta
        } catch (error) {
            console.error("Error al eliminar el ítem:", error);
        }
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    if (!cart || cart.items.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>Tu carrito está vacío</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mi Carrito</Text>
            </View>
            <FlatList
                data={cart.items}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                        <Image source={{ uri: item.product.imageUrl }} style={styles.productImage} />
                        <View style={styles.itemDetails}>
                            <Text style={styles.productName} numberOfLines={2}>{item.product.name}</Text>
                            <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                            <Text style={styles.productQuantity}>Cantidad: {item.quantity}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleRemoveItem(item._id)} style={styles.removeButton}>
                            <TrashIcon />
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.listContainer}
            />
            <View style={styles.footer}>
                <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>Total:</Text>
                    <Text style={styles.totalAmount}>${cart.total.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutButton}>
                    <Text style={styles.checkoutButtonText}>Proceder al Pago</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 18, color: '#666' },
    header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    listContainer: { paddingHorizontal: 10, paddingVertical: 10 },
    cartItem: { flexDirection: 'row', backgroundColor: 'white', padding: 10, borderRadius: 10, marginBottom: 10, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    productImage: { width: 80, height: 80, borderRadius: 8, marginRight: 15 },
    itemDetails: { flex: 1, justifyContent: 'center' },
    productName: { fontSize: 16, fontWeight: '600' },
    productPrice: { fontSize: 16, fontWeight: 'bold', color: '#333', marginVertical: 4 },
    productQuantity: { fontSize: 14, color: '#666' },
    removeButton: { padding: 10 },
    footer: { backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
    totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    totalText: { fontSize: 18, color: '#666' },
    totalAmount: { fontSize: 22, fontWeight: 'bold' },
    checkoutButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 30, alignItems: 'center' },
    checkoutButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
