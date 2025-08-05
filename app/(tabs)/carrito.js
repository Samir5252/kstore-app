import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { useFocusEffect, Link } from 'expo-router';
import { getCart, removeItemFromCart, updateCartItemQuantity } from '@/api/cartService';
import { useCart } from '@/context/CartContext';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

const TrashIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></Path></Svg>;
const PlusIcon = ({ color = '#333' }) => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 5v14M5 12h14"></Path></Svg>;
const MinusIcon = ({ color = '#333' }) => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12h14"></Path></Svg>;

export default function CartScreen() {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const { fetchCart: updateCartBadge } = useCart();

    const fetchCartData = useCallback(async () => {
        try {
            const { data } = await getCart();
            setCart(data);
        } catch (error) {
            console.error("Error al obtener el carrito:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { setLoading(true); fetchCartData(); }, []));

    // ▼▼▼ FILTRO PARA ÍTEMS VÁLIDOS ▼▼▼
    const validCartItems = useMemo(() => {
        if (!cart || !cart.items) return [];
        // Filtramos la lista para incluir solo los ítems donde 'item.product' no sea null.
        return cart.items.filter(item => item.product);
    }, [cart]);

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        const originalCart = cart;
        const newCart = { ...cart };
        const itemIndex = newCart.items.findIndex(i => i._id === itemId);
        
        if (itemIndex > -1) {
            newCart.items[itemIndex].quantity = newQuantity;
            setCart(newCart); 
        }

        try {
            const { data } = await updateCartItemQuantity(itemId, newQuantity);
            setCart(data); 
            updateCartBadge();
        } catch (error) {
            console.error("Error al actualizar cantidad:", error);
            setCart(originalCart); 
        }
    };

    const handleRemoveItem = async (itemId) => {
        try {
            const { data } = await removeItemFromCart(itemId);
            setCart(data);
            updateCartBadge();
        } catch (error) {
            console.error("Error al eliminar el ítem:", error);
        }
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    if (!cart || validCartItems.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>Tu carrito está vacío</Text>
                    <Text style={styles.emptySubtitle}>Explora nuestros productos y agrega tus favoritos.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}><Text style={styles.headerTitle}>Mi Carrito</Text></View>
            <FlatList
                // ▼▼▼ USAMOS LA LISTA FILTRADA ▼▼▼
                data={validCartItems}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View style={styles.cartItem}>
                        <Link href={`/product/${item.product._id}`} asChild>
                            <TouchableOpacity>
                                <Image 
                                    source={{ uri: `https://res.cloudinary.com/dhwaeyuyp/image/upload/${item.product.imageUrl}` }} 
                                    style={styles.productImage} 
                                />
                            </TouchableOpacity>
                        </Link>
                        <View style={styles.itemDetails}>
                            <Text style={styles.productName} numberOfLines={2}>{item.product.name}</Text>
                            <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                            <View style={styles.quantitySelector}>
                                <TouchableOpacity onPress={() => handleUpdateQuantity(item._id, item.quantity - 1)} style={styles.quantityButton} disabled={item.quantity <= 1}>
                                    <MinusIcon color="white"/>
                                </TouchableOpacity>
                                <Text style={styles.quantityText}>{item.quantity}</Text>
                                <TouchableOpacity onPress={() => handleUpdateQuantity(item._id, item.quantity + 1)} style={styles.quantityButton}>
                                    <PlusIcon color="white"/>
                                </TouchableOpacity>
                            </View>
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
                <TouchableOpacity>
                    <LinearGradient
                        colors={['#D0B3E5', '#C3B1E1']}
                        style={styles.checkoutButton}
                    >
                        <Text style={styles.checkoutButtonText}>Proceder al Pago</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F8FA', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    emptyText: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    emptySubtitle: { fontSize: 16, color: '#888', marginTop: 10, textAlign: 'center' },
    header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', backgroundColor: 'white' },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    listContainer: { padding: 15 },
    cartItem: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, padding: 10 },
    productImage: { width: 90, height: 90, borderRadius: 8, marginRight: 15 },
    itemDetails: { flex: 1, justifyContent: 'space-between' },
    productName: { fontSize: 16, fontWeight: '600' },
    productPrice: { fontSize: 16, fontWeight: 'bold', color: '#333', marginVertical: 4 },
    quantitySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6E6FA', borderRadius: 20, alignSelf: 'flex-start' },
    quantityButton: { padding: 8 },
    quantityText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 15, color: 'white' },
    removeButton: { padding: 10, alignSelf: 'flex-start' },
    footer: { backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#E0E0E0', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 10 },
    totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    totalText: { fontSize: 18, color: '#666' },
    totalAmount: { fontSize: 22, fontWeight: 'bold' },
    checkoutButton: { padding: 15, borderRadius: 30, alignItems: 'center' },
    checkoutButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
