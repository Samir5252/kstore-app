import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, ScrollView, FlatList, ActivityIndicator, TextInput, Platform, StatusBar } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, updateUserAddress } from '@/api/userService';
import { getMyOrders } from '@/api/orderService';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// --- Iconos ---
const BoxIcon = ({ color = '#C3B1E1' }) => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></Path><Path d="M3.27 6.96L12 12.01l8.73-5.05"></Path><Path d="M12 22.08V12"></Path></Svg>;
const MapPinIcon = ({ color = '#C3B1E1' }) => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></Path><Circle cx="12" cy="10" r="3"></Circle></Svg>;
const LockerIcon = ({ color = '#C3B1E1' }) => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="3" width="18" height="18" rx="2" ry="2"></Rect><Path d="M7 3v18"></Path><Path d="M12.5 8v8"></Path><Path d="M12.5 12H17"></Path></Svg>;
const CloseIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M18 6L6 18"></Path><Path d="M6 6l12 12"></Path></Svg>;
const ChevronRightIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D1D6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M9 18l6-6-6-6"></Path></Svg>;
const HomeIcon = ({ color = '#C3B1E1' }) => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></Path><Path d="M9 22V12h6v10"></Path></Svg>;

export default function MenuScreen() {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [lockerOrders, setLockerOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isAddressModalVisible, setAddressModalVisible] = useState(false);
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [userRes, ordersRes] = await Promise.all([
                        getCurrentUser(),
                        getMyOrders(),
                    ]);
                    
                    if (userRes && userRes.data) {
                        setUser(userRes.data);
                        setAddress(userRes.data.address || '');
                        setPhone(userRes.data.phone || '');
                    }
                    if (ordersRes && ordersRes.data) {
                        const allOrders = ordersRes.data;
                        setOrders(allOrders);
                        
                        const storePickupOrders = allOrders.filter(
                            order => order.deliveryMethod === 'TIENDA' && order.lockerCode
                        );
                        setLockerOrders(storePickupOrders);
                    }

                } catch (error) {
                    console.error("Error al cargar los datos del menú:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, [])
    );

    const handleSaveAddress = async () => {
        try {
            const updatedUser = await updateUserAddress({ address, phone });
            setUser(updatedUser.data); 
            setAddress(updatedUser.data.address || '');
            setPhone(updatedUser.data.phone || '');
            setAddressModalVisible(false);
        } catch (error) {
            console.error("Error al guardar la dirección:", error);
        }
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#C3B1E1" /></View>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Pedidos de {user?.name}</Text>
                    <Text style={styles.headerSubtitle}>Gestiona tus compras y tu cuenta</Text>
                </View>

                {lockerOrders.length > 0 && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconContainer}><LockerIcon /></View>
                            <Text style={styles.cardTitle}>Códigos de Casillero</Text>
                        </View>
                        {lockerOrders.map((order, index) => (
                             <View key={order._id} style={[styles.lockerItem, index === lockerOrders.length - 1 && { borderBottomWidth: 0 }]}>
                                 <Text style={styles.lockerOrderId}>Pedido #{order._id.substring(18)}</Text>
                                 <View style={styles.lockerCodeContainer}>
                                    <Text style={styles.lockerCode}>{order.lockerCode}</Text>
                                 </View>
                             </View>
                        ))}
                    </View>
                )}

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}><BoxIcon /></View>
                        <Text style={styles.cardTitle}>Historial de Pedidos</Text>
                    </View>
                    {orders.length > 0 ? (
                        orders.map((order, index) => (
                            <TouchableOpacity key={order._id} style={[styles.orderItem, index === orders.length - 1 && { borderBottomWidth: 0 }]} onPress={() => setSelectedOrder(order)}>
                                <View>
                                    <Text style={styles.orderId}>Pedido #{order._id.substring(18)}</Text>
                                    <Text style={styles.orderDate}>Fecha de Pedido: {new Date(order.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
                                    <ChevronRightIcon />
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : <Text style={styles.emptyText}>Aún no tienes pedidos.</Text>}
                </View>
                
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}><MapPinIcon /></View>
                        <Text style={styles.cardTitle}>Mi Dirección</Text>
                    </View>
                    <View style={styles.addressContent}>
                        <Text style={styles.addressText}>{user?.address || 'No has guardado una dirección.'}</Text>
                        <Text style={styles.addressPhone}>{user?.phone || ''}</Text>
                        <TouchableOpacity onPress={() => setAddressModalVisible(true)} style={styles.changeButtonContainer}>
                             <LinearGradient colors={['#D0B3E5', '#C3B1E1']} style={styles.changeButton}>
                                <Text style={styles.changeButtonText}>{user?.address ? 'Editar Dirección' : 'Agregar Dirección'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            
            <Modal visible={!!selectedOrder} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedOrder(null)}><CloseIcon /></TouchableOpacity>
                        <LinearGradient colors={['#D0B3E5', '#C3B1E1']} style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detalles del Pedido</Text>
                        </LinearGradient>
                        
                        <ScrollView>
                            <Text style={styles.modalSectionTitle}>Productos</Text>
                            <FlatList
                                scrollEnabled={false}
                                data={selectedOrder?.orderDetails}
                                keyExtractor={(item) => item._id}
                                renderItem={({ item }) => (
                                    <View style={styles.modalProductItem}>
                                        <View style={styles.quantityCircle}>
                                            <Text style={styles.quantityText}>{item.quantity}</Text>
                                        </View>
                                        <Text style={styles.modalProductText}>{item.name}</Text>
                                        <Text style={styles.modalProductPrice}>${item.price.toFixed(2)}</Text>
                                    </View>
                                )}
                            />

                            {selectedOrder?.deliveryMethod === 'DOMICILIO' && (
                                <>
                                    <Text style={styles.modalSectionTitle}>Dirección de Envío</Text>
                                    <View style={styles.shippingInfoContainer}>
                                        <HomeIcon />
                                        <View style={{marginLeft: 15, flex: 1}}>
                                            <Text style={styles.shippingName}>{selectedOrder?.customer?.name}</Text>
                                            <Text style={styles.shippingAddress}>{selectedOrder?.customer?.address}</Text>
                                        </View>
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.modalTotalContainer}>
                            <Text style={styles.modalTotalText}>Total:</Text>
                            <Text style={styles.modalTotalValue}>${selectedOrder?.total.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>
            </Modal>
            
            <Modal visible={isAddressModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setAddressModalVisible(false)}><CloseIcon /></TouchableOpacity>
                        <Text style={styles.modalTitle}>Tu Dirección</Text>
                        <TextInput style={styles.input} placeholder="Calle, número, colonia..." value={address} onChangeText={setAddress} placeholderTextColor="#6E6E73" />
                         <TextInput style={styles.input} placeholder="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#6E6E73"/>
                        <TouchableOpacity onPress={handleSaveAddress}>
                            <LinearGradient colors={['#D0B3E5', '#C3B1E1']} style={styles.saveButton}>
                                <Text style={styles.saveButtonText}>Guardar Dirección</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F7FA', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    container: { padding: 20, paddingBottom: 50 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 30, alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1D1D1F' },
    headerSubtitle: { fontSize: 18, color: '#6E6E73', marginTop: 5 },
    card: { 
        backgroundColor: 'white', 
        borderRadius: 20, 
        marginBottom: 20, 
        padding: 20, 
        shadowColor: "#C3B1E1", 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.15, 
        shadowRadius: 10, 
        elevation: 5 
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#F5F3F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: { fontSize: 18, fontWeight: '600', marginLeft: 15, color: '#1D1D1F' },
    orderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0EEF2' },
    orderId: { fontSize: 16, fontWeight: '500', color: '#1D1D1F' },
    orderDate: { fontSize: 14, color: '#6E6E73', marginTop: 3 },
    orderTotal: { fontSize: 16, fontWeight: 'bold', color: '#1D1D1F', marginRight: 5 },
    emptyText: { color: '#888', fontStyle: 'italic', paddingVertical: 10 },
    addressContent: { alignItems: 'flex-start' },
    addressText: { fontSize: 16, color: '#333', lineHeight: 24 },
    addressPhone: { fontSize: 16, color: '#6E6E73', lineHeight: 24, marginTop: 4 },
    changeButtonContainer: { marginTop: 15, width: '100%' },
    changeButton: { paddingVertical: 12, borderRadius: 25, alignItems: 'center' },
    changeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContent: { 
        width: '90%', 
        backgroundColor: 'white', 
        borderRadius: 20, 
        elevation: 10, 
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    closeButton: { position: 'absolute', top: 15, right: 15, padding: 5, zIndex: 1, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 15 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    modalSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1D1D1F',
        paddingHorizontal: 25,
        marginTop: 20,
        marginBottom: 10,
    },
    modalProductItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 15, 
        paddingHorizontal: 25, 
        borderBottomWidth: 1, 
        borderBottomColor: '#f0f0f0' 
    },
    quantityCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F5F3F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    quantityText: {
        color: '#8E44AD',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalProductText: { fontSize: 16, flex: 1, color: '#333' },
    modalProductPrice: { fontSize: 16, fontWeight: '600', color: '#333' },
    shippingInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F3F7',
        padding: 15,
        borderRadius: 15,
        marginHorizontal: 25,
        marginBottom: 15,
    },
    shippingName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1D1D1F',
    },
    shippingAddress: {
        fontSize: 14,
        color: '#6E6E73',
        marginTop: 2,
    },
    modalTotalContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, paddingHorizontal: 25, paddingBottom: 20, borderTopWidth: 2, borderTopColor: '#F0EEF2' },
    modalTotalText: { fontSize: 18, fontWeight: 'bold', color: '#6E6E73' },
    modalTotalValue: { fontSize: 20, fontWeight: 'bold', color: '#1D1D1F' },
    
    input: { backgroundColor: '#F5F5F5', color: '#1D1D1F', borderWidth: 1, borderColor: '#EAEAEA', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, width: '100%' },
    saveButton: { padding: 15, borderRadius: 30, alignItems: 'center' },
    saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    
    lockerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    lockerOrderId: { fontSize: 14, color: '#666' },
    lockerCodeContainer: {
        backgroundColor: '#F5F3F7',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    lockerCode: { fontSize: 20, fontWeight: 'bold', color: '#8E44AD', letterSpacing: 3 },
});
