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
const PlusIcon = ({ color = '#333' }) => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 5v14M5 12h14"></Path></Svg>;
const MinusIcon = ({ color = '#333' }) => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12h14"></Path></Svg>;
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

const DetailRow = ({ label, value }) => {
    const renderValue = () => {
        if (React.isValidElement(value)) {
            return value;
        }
        if (typeof value === 'object' && value !== null) {
            console.warn(`Se intentó renderizar un objeto en DetailRow para la etiqueta: ${label}`);
            return <Text style={styles.detailValue}>Dato no disponible</Text>;
        }
        return <Text style={styles.detailValue}>{value}</Text>;
    };

    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            {renderValue()}
        </View>
    );
};

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
            showAlert(error.response?.data?.message || "No se pudo agregar el producto.", 'error');
        }
    };

    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#C3B1E1" /></View>;
    if (!product) return <View style={styles.centered}><Text>Producto no encontrado.</Text></View>;

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const isAvailable = product.active && product.stock > 0;
    const stockColor = product.stock > 10 ? '#4CAF50' : (product.stock > 0 ? '#FFA500' : '#FF6B6B');
    const discountPercentage = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <CustomAlert visible={alert.visible} message={alert.message} type={alert.type} onHide={() => setAlert({ ...alert, visible: false })} />
            <Stack.Screen options={{ title: product.name, headerTitleStyle: { color: '#333' }, headerStyle: { backgroundColor: '#F8F7FA' } }} />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.imageContainer}>
                    <Image 
                        source={{ uri: `https://res.cloudinary.com/dhwaeyuyp/image/upload/${product.imageUrl}` }} 
                        style={styles.productImage} 
                    />
                    {hasDiscount && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.badgeText}>{discountPercentage}% OFF</Text>
                        </View>
                    )}
                    {product.prevent && (
                        <View style={[styles.discountBadge, styles.preorderBadge]}>
                            <Text style={styles.badgeText}>PREVENTA</Text>
                        </View>
                    )}
                </View>
                
                <View style={styles.detailsContainer}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.priceContainer}>
                        <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                        {hasDiscount && <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>}
                    </View>
                    <Text style={styles.description}>{product.description}</Text>
                    
                    <View style={styles.separator} />

                    <TouchableOpacity style={styles.detailsToggle} onPress={toggleDetails}>
                        <Text style={styles.detailsTitle}>Detalles del Producto</Text>
                        <Animated.View style={{ transform: [{ rotate: detailsExpanded ? '180deg' : '0deg' }] }}>
                            <ChevronDown />
                        </Animated.View>
                    </TouchableOpacity>

                    {detailsExpanded && (
                        <View style={styles.detailsContent}>
                            <DetailRow label="Artista" value={product.artist?.name || 'N/A'} />
                            <DetailRow label="Categoría" value={product.category?.name || 'N/A'} />
                            <DetailRow label="SKU" value={product.sku || 'N/A'} />
                            <DetailRow 
                                label="Disponibles" 
                                value={<Text style={{ color: stockColor, fontWeight: 'bold' }}>{product.stock}</Text>} 
                            />
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
                        <TouchableOpacity onPress={handleAddToCart} style={styles.addToCartButtonContainer}>
                            <LinearGradient
                                colors={['#D0B3E5', '#C3B1E1']}
                                style={styles.addToCartButton}
                            >
                                <CartIcon />
                                <Text style={styles.addToCartButtonText}>Agregar</Text>
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
    safeArea: { flex: 1, backgroundColor: '#F8F7FA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F7FA' },
    scrollContainer: { paddingBottom: 120 },
    imageContainer: {
        padding: 10,
        backgroundColor: 'white',
        margin: 15,
        borderRadius: 25,
        shadowColor: "#C3B1E1",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    productImage: { 
        width: '100%', 
        aspectRatio: 1,
        resizeMode: 'cover',
        borderRadius: 20,
    },
    discountBadge: { 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        backgroundColor: '#FF6B6B', 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 15,
        zIndex: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    preorderBadge: {
        backgroundColor: '#8E44AD',
        left: 'auto',
        right: 20,
    },
    badgeText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    detailsContainer: { 
        paddingHorizontal: 25,
        paddingTop: 10,
    },
    productName: { fontSize: 32, fontWeight: 'bold', color: '#1D1D1F', marginBottom: 8 },
    priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 15 },
    productPrice: { fontSize: 34, fontWeight: 'bold', color: '#1D1D1F' },
    originalPrice: { fontSize: 22, color: '#999', textDecorationLine: 'line-through', marginLeft: 12 },
    description: { fontSize: 16, color: '#6E6E73', lineHeight: 24 },
    separator: { height: 1, backgroundColor: '#F0EEF2', marginVertical: 20 },
    detailsToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    detailsTitle: { fontSize: 18, fontWeight: '600', color: '#1D1D1F' },
    detailsContent: { marginTop: 10 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F0EEF2' },
    detailLabel: { fontSize: 16, color: '#6E6E73' },
    detailValue: { fontSize: 16, fontWeight: '600', color: '#1D1D1F' },
    
    footer: {
        position: 'absolute',
        bottom: 15,
        left: 15,
        right: 15,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 0,
        borderRadius: 35,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 15,
    },
    quantitySelector: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#F5F3F7',
        borderRadius: 25,
    },
    quantityButton: { padding: 12 },
    quantityText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 18, color: '#1D1D1F' },
    addToCartButtonContainer: {
        flex: 1,
        marginLeft: 10,
    },
    addToCartButton: { 
        paddingVertical: 15,
        borderRadius: 25, 
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: "#C3B1E1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    addToCartButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    notAvailableContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 18,
        backgroundColor: '#8E44AD',
        borderRadius: 30,
    },
    notAvailableText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },

    alertContainer: { position: 'absolute', top: 50, left: 20, right: 20, padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', zIndex: 1000, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    alertText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
});
