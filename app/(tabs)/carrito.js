import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ActivityIndicator, Platform, StatusBar, Modal, Animated } from 'react-native';
import { useFocusEffect, Link, useRouter } from 'expo-router';
import { getCart, removeItemFromCart, updateCartItemQuantity } from '@/api/cartService';
import { createPaypalOrder, capturePaypalOrder } from '@/api/paymentService';
import { useCart } from '@/context/CartContext';
import Svg, { Path, Rect } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';

// --- Iconos ---
const TrashIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></Path></Svg>;
const PlusIcon = ({ color = '#333' }) => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 5v14M5 12h14"></Path></Svg>;
const MinusIcon = ({ color = '#333' }) => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12h14"></Path></Svg>;
const SuccessIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></Path><Path d="M22 4L12 14.01l-3-3"></Path></Svg>;
const ErrorIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></Path><Path d="M12 9v4"></Path><Path d="M12 17h.01"></Path></Svg>;

// --- Componente para Radio Button ---
const RadioButton = ({ label, value, selectedValue, onSelect }) => (
    <TouchableOpacity style={styles.radioContainer} onPress={() => onSelect(value)}>
        <View style={[styles.radioOuterCircle, selectedValue === value && styles.radioSelectedOuter]}>
            {selectedValue === value && <View style={styles.radioInnerCircle} />}
        </View>
        <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
);

// --- Componente de Alerta Personalizada (Toast) ---
const CustomAlert = ({ visible, message, type, onHide }) => {
    const fadeAnim = useState(new Animated.Value(0))[0];
    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            setTimeout(() => {
                Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onHide());
            }, 3000);
        }
    }, [visible]);
    if (!visible) return null;
    const backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
    const Icon = type === 'success' ? SuccessIcon : ErrorIcon;
    return (<Animated.View style={[styles.alertContainer, { opacity: fadeAnim, backgroundColor }]}><Icon /><Text style={styles.alertText}>{message}</Text></Animated.View>);
};

export default function CartScreen() {
    const { cart, loading, fetchCart: updateCartAndBadge } = useCart();
    const router = useRouter();
    const webviewRef = useRef(null);
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);

    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [paypalUrl, setPaypalUrl] = useState(null);
    const [paypalOrderId, setPaypalOrderId] = useState(null);
    const [alert, setAlert] = useState({ visible: false, message: '', type: '' });
    const [deliveryMethod, setDeliveryMethod] = useState('DOMICILIO');

    const showAlert = (message, type = 'success') => setAlert({ visible: true, message, type });

    useFocusEffect(useCallback(() => { updateCartAndBadge(); }, []));

    const validCartItems = useMemo(() => cart?.items?.filter(item => item.product) || [], [cart]);

    const handleCheckout = async () => {
        if (checkoutLoading) return;
        setCheckoutLoading(true);
        try {
            const response = await createPaypalOrder(cart._id, deliveryMethod);
            if (response && response.data && response.data.orderID) {
                const { orderID } = response.data;
                setPaypalOrderId(orderID);
                const yourHostedPageUrl = `https://harmonious-kitsune-1fe5c0.netlify.app`;
                const urlParaWebView = `${yourHostedPageUrl}?orderID=${orderID}`;
                console.log("Cargando WebView con la siguiente URL:", urlParaWebView);
                setPaypalUrl(urlParaWebView);
            } else {
                showAlert('El backend no devolvió un ID de orden.', 'error');
            }
        } catch (error) {
            console.error("Error al iniciar el pago:", error.response?.data || error.message);
            showAlert('No se pudo iniciar el proceso de pago.', 'error');
        } finally {
            setCheckoutLoading(false);
        }
    };

    const onShouldStartLoadWithRequest = (request) => {
        const { url } = request;
        if (!url) return true;

        if (url.includes('paypal/success') && !isProcessingOrder) {
            setIsProcessingOrder(true);
            webviewRef.current?.stopLoading();
            setPaypalUrl(null);
            showAlert('Procesando pago...', 'success');
            
            capturePaypalOrder(paypalOrderId, cart._id, deliveryMethod)
                .then(() => {
                    showAlert('¡Gracias por comprar en K-Store!', 'success');
                    setTimeout(() => {
                        updateCartAndBadge();
                        router.replace('/(tabs)');
                        setIsProcessingOrder(false);
                    }, 2500);
                })
                .catch(err => {
                    showAlert("Hubo un problema al confirmar tu pago.", 'error');
                    setIsProcessingOrder(false);
                });
            return false;
        }
        if (url.includes('paypal/cancel')) {
            webviewRef.current?.stopLoading();
            setPaypalUrl(null);
            showAlert("Has cancelado el proceso de pago.", 'error');
            return false;
        }
        return true;
    };
    
    const handleUpdateQuantity = async (itemId, newQuantity) => {
        try {
            await updateCartItemQuantity(itemId, newQuantity);
            updateCartAndBadge();
        } catch (error) {
            console.error("Error al actualizar cantidad:", error);
            showAlert("No se pudo actualizar la cantidad.", 'error');
        }
    };

    const handleRemoveItem = async (itemId) => {
        try {
            await removeItemFromCart(itemId);
            updateCartAndBadge();
        } catch (error) {
            console.error("Error al eliminar el ítem:", error);
            showAlert("No se pudo eliminar el producto.", 'error');
        }
    };

    if (loading) { return <View style={styles.centered}><ActivityIndicator size="large" color="#333" /></View>; }
    if (!cart || validCartItems.length === 0) { return ( <SafeAreaView style={styles.safeArea}><View style={styles.centered}><Text style={styles.emptyText}>Tu carrito está vacío</Text><Text style={styles.emptySubtitle}>Explora nuestros productos.</Text></View></SafeAreaView> ); }

    return (
        <SafeAreaView style={styles.safeArea}>
            <CustomAlert visible={alert.visible} message={alert.message} type={alert.type} onHide={() => setAlert({ ...alert, visible: false })} />
            
            <Modal visible={!!paypalUrl} animationType="slide" onRequestClose={() => setPaypalUrl(null)}>
                <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
                    <TouchableOpacity onPress={() => setPaypalUrl(null)} style={styles.closeModalButton}>
                        <Text style={styles.closeModalText}>Cancelar Pago</Text>
                    </TouchableOpacity>
                    <WebView 
                        ref={webviewRef}
                        source={{ uri: paypalUrl }} 
                        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
                        onError={(e) => console.warn('Error en WebView:', e.nativeEvent)}
                        onHttpError={(e) => console.warn('Error HTTP en WebView:', e.nativeEvent)}
                    />
                </SafeAreaView>
            </Modal>
            
            <View style={styles.header}><Text style={styles.headerTitle}>Mi Carrito</Text></View>
            
            <FlatList
                data={validCartItems}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                     <View style={styles.cartItem}>
                        <Link href={`/product/${item.product._id}`} asChild>
                            <TouchableOpacity>
                                <Image source={{ uri: `https://res.cloudinary.com/dhwaeyuyp/image/upload/${item.product.imageUrl}` }} style={styles.productImage} />
                            </TouchableOpacity>
                        </Link>
                        <View style={styles.itemDetails}>
                            <Text style={styles.productName} numberOfLines={2}>{item.product.name}</Text>
                            <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                            <View style={styles.quantitySelector}>
                                <TouchableOpacity onPress={() => handleUpdateQuantity(item._id, item.quantity - 1)} style={styles.quantityButton} disabled={item.quantity <= 1}><MinusIcon /></TouchableOpacity>
                                <Text style={styles.quantityText}>{item.quantity}</Text>
                                <TouchableOpacity onPress={() => handleUpdateQuantity(item._id, item.quantity + 1)} style={styles.quantityButton}><PlusIcon /></TouchableOpacity>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => handleRemoveItem(item._id)} style={styles.removeButton}><TrashIcon /></TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.listContainer}
                ListFooterComponent={<View style={{ height: 300 }} />}
            />
            
            <View style={styles.footer}>
                <Text style={styles.summaryTitle}>Resumen del Pedido</Text>
                <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>Subtotal:</Text>
                    <Text style={styles.totalAmount}>${cart?.total?.toFixed(2) ?? '0.00'}</Text>
                </View>
                <View style={[styles.totalContainer, {marginBottom: 20}]}>
                    <Text style={styles.totalTextBold}>Total:</Text>
                    <Text style={styles.totalAmountBold}>${cart?.total?.toFixed(2) ?? '0.00'}</Text>
                </View>

                <View style={styles.deliveryContainer}>
                    <RadioButton label="Envío a Domicilio" value="DOMICILIO" selectedValue={deliveryMethod} onSelect={setDeliveryMethod} />
                    <RadioButton label="Recoger en Tienda" value="TIENDA" selectedValue={deliveryMethod} onSelect={setDeliveryMethod} />
                </View>

                <TouchableOpacity onPress={handleCheckout} disabled={checkoutLoading}>
                    <LinearGradient
                        colors={checkoutLoading ? ['#ccc', '#aaa'] : ['#D0B3E5', '#C3B1E1']}
                        style={styles.checkoutButton}
                    >
                        {checkoutLoading 
                            ? <ActivityIndicator color="white" />
                            : <Text style={styles.checkoutButtonText}>Proceder al Pago</Text>
                        }
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    emptyText: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    emptySubtitle: { fontSize: 16, color: '#888', marginTop: 10, textAlign: 'center' },
    header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', backgroundColor: 'white' },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    listContainer: { paddingBottom: 15, paddingHorizontal: 15 },
    cartItem: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, padding: 10 },
    productImage: { width: 90, height: 90, borderRadius: 8, marginRight: 15 },
    itemDetails: { flex: 1, justifyContent: 'space-between' },
    productName: { fontSize: 16, fontWeight: '600', height: 40 },
    productPrice: { fontSize: 16, fontWeight: 'bold', color: '#333', marginVertical: 4 },
    quantitySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 20, alignSelf: 'flex-start' },
    quantityButton: { padding: 8 },
    quantityText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 15, color: '#333' },
    removeButton: { padding: 10, alignSelf: 'center' },
    footer: { backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#E0E0E0', position: 'absolute', bottom: 0, left: 0, right: 0 },
    summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    totalText: { fontSize: 16, color: '#666' },
    totalAmount: { fontSize: 16 },
    totalTextBold: { fontSize: 20, color: '#333', fontWeight: 'bold' },
    totalAmountBold: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    deliveryContainer: { marginBottom: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 20 },
    radioContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    radioOuterCircle: { height: 24, width: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
    radioSelectedOuter: { borderColor: '#8E44AD' },
    radioInnerCircle: { height: 12, width: 12, borderRadius: 6, backgroundColor: '#8E44AD' },
    radioLabel: { marginLeft: 10, fontSize: 16 },
    checkoutButton: { padding: 15, borderRadius: 30, alignItems: 'center' },
    checkoutButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    alertContainer: { position: 'absolute', top: 60, left: 20, right: 20, padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', zIndex: 1000, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    alertText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
    closeModalButton: { padding: 15, alignItems: 'center', backgroundColor: '#f0f0f0' },
    closeModalText: { fontSize: 16, color: '#333', fontWeight: 'bold' },
});