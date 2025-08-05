import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, ScrollView, ActivityIndicator, TouchableOpacity, Animated, Platform, StatusBar, LayoutAnimation, UIManager } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { getProductById } from '@/api/productService';
import { addItemToCart } from '@/api/cartService';
import { useCart } from '@/context/CartContext';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// Habilitar LayoutAnimation para Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Iconos y Componentes ---
const PlusIcon = ({ color = 'white' }) => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 5v14M5 12h14"></Path></Svg>;
const MinusIcon = ({ color = 'white' }) => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12h14"></Path></Svg>;
const CartIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></Path><Path d="M3 6h18"></Path><Path d="M16 10a4 4 0 0 1-8 0"></Path></Svg>;
const SuccessIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></Path><Path d="M22 4L12 14.01l-3-3"></Path></Svg>;
const ChevronDown = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M6 9l6 6 6-6"></Path></Svg>;

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
    const Icon = type === 'success' ? SuccessIcon : () => null;
    return (<Animated.View style={[styles.alertContainer, { opacity: fadeAnim, backgroundColor }]}><Icon /><Text style={styles.alertText}>{message}</Text></Animated.View>);
};

const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [detailsExpanded, setDetailsExpanded] = useState(false);
    const [alert, setAlert] = useState({ visible: false, message: '', type: '' });
    const { fetchCart } = useCart();

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

    const toggleDetails = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setDetailsExpanded(!detailsExpanded);
    };

    const showAlert = (message, type = 'success') => {
        setAlert({ visible: true, message, type });
    };

    const handleAddToCart = async () => {
        try {
            await addItemToCart(product._id, quantity);
            showAlert(`${quantity} x ${product.name} agregado(s) al carrito.`, 'success');
            fetchCart();
        } catch (error) {
            console.error("Error al añadir al carrito:", error);
            showAlert(error.message || "No se pudo agregar el producto.", 'error');
        }
    };

    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    if (!product) return <View style={styles.centered}><Text>Producto no encontrado.</Text></View>;

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const isAvailable = product.active && product.stock > 0;
    const stockColor = product.stock > 10 ? '#4CAF50' : '#FFA500';

    return (
        <SafeAreaView style={styles.safeArea}>
            <CustomAlert visible={alert.visible} message={alert.message} type={alert.type} onHide={() => setAlert({ ...alert, visible: false })} />
            <Stack.Screen options={{ title: product.name }} />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.imageCard}>
                    {hasDiscount && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.badgeText}>-{product.discountPercentage}%</Text>
                        </View>
                    )}
                    {product.prevent && (
                        <View style={[styles.discountBadge, styles.preorderBadge]}>
                            <Text style={styles.badgeText}>PREVENTA</Text>
                        </View>
                    )}
                    <Image 
                        source={{ uri: `https://res.cloudinary.com/dhwaeyuyp/image/upload/${product.imageUrl}` }} 
                        style={styles.productImage} 
                    />
                </View>
                
                <View style={styles.detailsCard}>
                    <Text style={styles.artistText}>{product.artist || 'Artista Desconocido'}</Text>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.priceContainer}>
                        <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                        {hasDiscount && <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>}
                    </View>
                    <View style={styles.separator} />
                    <Text style={styles.descriptionTitle}>Descripción</Text>
                    <Text style={styles.description}>{product.description}</Text>
                    <View style={styles.separator} />

                    <TouchableOpacity style={styles.detailsToggle} onPress={toggleDetails}>
                        <Text style={styles.descriptionTitle}>Detalles del Producto</Text>
                        <Animated.View style={{ transform: [{ rotate: detailsExpanded ? '180deg' : '0deg' }] }}>
                            <ChevronDown />
                        </Animated.View>
                    </TouchableOpacity>

                    {detailsExpanded && (
                        <View>
                            <DetailRow label="Categoría" value={product.category?.name || 'N/A'} />
                            <DetailRow label="SKU" value={product.sku || 'N/A'} />
                            <DetailRow label="Disponibles" value={<Text style={{ color: stockColor, fontWeight: 'bold' }}>{product.stock}</Text>} />
                        </View>
                    )}
                </View>
            </ScrollView>
            <View style={styles.footer}>
                {isAvailable ? (
                    <>
                        <View style={styles.quantitySelector}>
                            <TouchableOpacity onPress={() => setQuantity(q => Math.max(1, q - 1))} style={styles.quantityButton}>
                                <MinusIcon />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{quantity}</Text>
                            <TouchableOpacity onPress={() => setQuantity(q => Math.min(product.stock, q + 1))} style={styles.quantityButton}>
                                <PlusIcon />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={handleAddToCart}>
                            <LinearGradient
                                colors={['#D0B3E5', '#C3B1E1']}
                                style={styles.addToCartButton}
                            >
                                <CartIcon />
                                <Text style={styles.addToCartButtonText}>Agregar al Carrito</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.notAvailableContainer}>
                        <Text style={styles.notAvailableText}>No disponible</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F8FA', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContainer: { paddingBottom: 120 },
    imageCard: {
        margin: 15,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    productImage: { 
        width: '100%', 
        height: 350, 
        resizeMode: 'contain',
        borderRadius: 15,
    },
    discountBadge: { 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        backgroundColor: '#FF6B6B', 
        paddingHorizontal: 10, 
        paddingVertical: 5, 
        borderRadius: 15,
        zIndex: 1,
    },
    preorderBadge: {
        backgroundColor: '#8E44AD', // Un lila más oscuro para preventa
        left: 'auto',
        right: 20,
    },
    badgeText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    detailsCard: { 
        padding: 25,
        backgroundColor: 'white',
        marginHorizontal: 15,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    artistText: { fontSize: 16, color: '#888', marginBottom: 4 },
    productName: { fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
    priceContainer: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 20 },
    productPrice: { fontSize: 28, fontWeight: 'bold', color: '#333' },
    originalPrice: { fontSize: 18, color: '#999', textDecorationLine: 'line-through', marginLeft: 12, marginBottom: 2 },
    separator: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 15 },
    descriptionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
    description: { fontSize: 16, color: '#666', lineHeight: 24 },
    detailsToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
    detailLabel: { fontSize: 16, color: '#888' },
    detailValue: { fontSize: 16, fontWeight: '500' },
    
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quantitySelector: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#E6E6FA', // Lila
        borderRadius: 30,
    },
    quantityButton: { padding: 12 },
    quantityText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 18, color: 'white' },
    addToCartButton: { 
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 30, 
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    addToCartButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    notAvailableContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#8E44AD', // Lila más oscuro
        borderRadius: 30,
    },
    notAvailableText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white', // Texto blanco para contraste
    },

    alertContainer: { position: 'absolute', top: 50, left: 20, right: 20, padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', zIndex: 1000, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    alertText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
});
