import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, ScrollView, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { getProductById } from '@/api/productService';
import { addItemToCart } from '@/api/cartService';
import { useCart } from '@/context/CartContext'; // 1. Importa el hook del carrito
import Svg, { Path } from 'react-native-svg';

// --- Iconos y Alerta Personalizada (código existente) ---
const PlusIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 5v14M5 12h14"></Path></Svg>;
const MinusIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12h14"></Path></Svg>;
const CartIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></Path><Path d="M3 6h18"></Path><Path d="M16 10a4 4 0 0 1-8 0"></Path></Svg>;
const SuccessIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></Path><Path d="M22 4L12 14.01l-3-3"></Path></Svg>;
const ErrorIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 9v2m0 4h.01"></Path><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></Path></Svg>;

const CustomAlert = ({ visible, message, type, onHide }) => {
    const fadeAnim = useState(new Animated.Value(0))[0];
    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            setTimeout(() => {
                Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onHide());
            }, 2500);
        }
    }, [visible]);
    if (!visible) return null;
    const backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
    const Icon = type === 'success' ? SuccessIcon : ErrorIcon;
    return (<Animated.View style={[styles.alertContainer, { opacity: fadeAnim, backgroundColor }]}><Icon /><Text style={styles.alertText}>{message}</Text></Animated.View>);
};

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [alert, setAlert] = useState({ visible: false, message: '', type: '' });
    const { fetchCart } = useCart(); // 2. Obtiene la función para refrescar el carrito

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await getProductById(id);
                setProduct(response.data);
            } catch (error) {
                console.error("Error al obtener el producto:", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProduct();
    }, [id]);

    const showAlert = (message, type = 'error') => {
        setAlert({ visible: true, message, type });
    };

    const handleAddToCart = async () => {
        try {
            await addItemToCart(product._id, quantity);
            showAlert(`${quantity} x ${product.name} agregado(s) al carrito.`, 'success');
            fetchCart(); // 3. Llama a la función para actualizar el contador del carrito
        } catch (error) {
            console.error("Error al añadir al carrito:", error);
            showAlert(error.message || "No se pudo agregar el producto.");
        }
    };

    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    if (!product) return <View style={styles.centered}><Text>Producto no encontrado.</Text></View>;

    return (
        <SafeAreaView style={styles.safeArea}>
            <CustomAlert visible={alert.visible} message={alert.message} type={alert.type} onHide={() => setAlert({ ...alert, visible: false })} />
            <Stack.Screen options={{ title: product.name }} />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.imageContainer}><Image source={{ uri: product.imageUrl }} style={styles.productImage} /></View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                    <Text style={styles.descriptionTitle}>Descripción</Text>
                    <Text style={styles.description}>{product.description}</Text>
                    <View style={styles.quantityContainer}>
                        <Text style={styles.quantityLabel}>Cantidad:</Text>
                        <View style={styles.quantitySelector}>
                            <TouchableOpacity onPress={() => setQuantity(q => Math.max(1, q - 1))} style={styles.quantityButton}><MinusIcon /></TouchableOpacity>
                            <Text style={styles.quantityText}>{quantity}</Text>
                            <TouchableOpacity onPress={() => setQuantity(q => q + 1)} style={styles.quantityButton}><PlusIcon /></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
            <View style={styles.footer}><TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}><CartIcon /><Text style={styles.addToCartButtonText}>Agregar al Carrito</Text></TouchableOpacity></View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContainer: { paddingBottom: 100 },
    imageContainer: { padding: 20 },
    productImage: { width: '100%', height: 350, resizeMode: 'contain', borderRadius: 20, backgroundColor: 'white' },
    detailsContainer: { padding: 20, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20, paddingTop: 40 },
    productName: { fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
    productPrice: { fontSize: 24, fontWeight: '700', color: '#333', marginBottom: 20 },
    descriptionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
    description: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 30 },
    quantityContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 20 },
    quantityLabel: { fontSize: 18, fontWeight: '500' },
    quantitySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 30 },
    quantityButton: { padding: 15 },
    quantityText: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 20 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    addToCartButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 30, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
    addToCartButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    alertContainer: { position: 'absolute', top: 50, left: 20, right: 20, padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', zIndex: 1000 },
    alertText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
});
