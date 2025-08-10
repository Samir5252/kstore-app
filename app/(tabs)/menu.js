import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, ScrollView, FlatList, ActivityIndicator, TextInput, Platform, StatusBar } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, updateUserAddress } from '@/api/userService';
import { getMyOrders } from '@/api/orderService';
import Svg, { Path, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// --- Iconos ---
const BoxIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></Path><Path d="M3.27 6.96L12 12.01l8.73-5.05"></Path><Path d="M12 22.08V12"></Path></Svg>;
const MapPinIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></Path><Path d="M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></Path></Svg>;
const LockerIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="3" width="18" height="18" rx="2" ry="2"></Rect><Path d="M7 3v18"></Path><Path d="M12.5 8v8"></Path><Path d="M12.5 12H17"></Path></Svg>;
const CloseIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M18 6L6 18"></Path><Path d="M6 6l12 12"></Path></Svg>;
const LogOutIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></Path><Path d="M16 17l5-5-5-5"></Path><Path d="M21 12H9"></Path></Svg>;

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
                        
                        // Filtramos las órdenes que tienen código de casillero
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

    const handleLogout = async () => {
        await AsyncStorage.removeItem('userToken');
        router.replace('/login');
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#333" /></View>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Hola, {user?.name}</Text>
                    <Text style={styles.headerSubtitle}>Gestiona tu cuenta y tus compras</Text>
                </View>

                {/* Nueva sección para Códigos de Casillero */}
                {lockerOrders.length > 0 && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}><LockerIcon /><Text style={styles.cardTitle}>Códigos de Casillero</Text></View>
                        {lockerOrders.map(order => (
                             <View key={order._id} style={styles.lockerItem}>
                                 <Text style={styles.lockerOrderId}>Pedido #{order._id.substring(18)}</Text>
                                 <Text style={styles.lockerCode}>{order.lockerCode}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Sección Historial de Pedidos */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}><BoxIcon /><Text style={styles.cardTitle}>Historial de Pedidos</Text></View>
                    {orders.length > 0 ? (
                        orders.map(order => (
                            <TouchableOpacity key={order._id} style={styles.orderItem} onPress={() => setSelectedOrder(order)}>
                                <Text style={styles.orderId}>Pedido #{order._id.substring(18)}</Text>
                                <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                                <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
                            </TouchableOpacity>
                        ))
                    ) : <Text style={styles.emptyText}>Aún no tienes pedidos.</Text>}
                </View>
                
                {/* Sección Mis Direcciones */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}><MapPinIcon /><Text style={styles.cardTitle}>Mi Dirección</Text></View>
                    <View style={styles.addressContent}>
                        <Text style={styles.addressText}>{user?.address || 'No has guardado una dirección.'}</Text>
                        <Text style={styles.addressText}>{user?.phone || ''}</Text>
                        <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
                            <Text style={styles.changeButton}>{user?.address ? 'Editar Dirección' : 'Agregar Dirección'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOutIcon />
                    <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>

            </ScrollView>
            
            {/* Modal para ver detalles del pedido */}
            <Modal visible={!!selectedOrder} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedOrder(null)}><CloseIcon /></TouchableOpacity>
                        <Text style={styles.modalTitle}>Detalles del Pedido</Text>
                        <Text style={styles.modalOrderId}>ID: {selectedOrder?._id}</Text>
                        <FlatList
                            data={selectedOrder?.orderDetails}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <View style={styles.modalProductItem}>
                                    <Text style={styles.modalProductText}>{item.quantity}x {item.name}</Text>
                                    <Text style={styles.modalProductText}>${item.price.toFixed(2)}</Text>
                                </View>
                            )}
                        />
                        <View style={styles.modalTotalContainer}>
                            <Text style={styles.modalTotalText}>Total:</Text>
                            <Text style={styles.modalTotalText}>${selectedOrder?.total.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>
            </Modal>
            
            {/* Modal para agregar/editar dirección */}
            <Modal visible={isAddressModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setAddressModalVisible(false)}><CloseIcon /></TouchableOpacity>
                        <Text style={styles.modalTitle}>Tu Dirección</Text>
                        <TextInput style={styles.input} placeholder="Calle, número, colonia..." value={address} onChangeText={setAddress} />
                         <TextInput style={styles.input} placeholder="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
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

// --- Estilos ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F8FA', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    container: { padding: 20, paddingBottom: 50 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 30 },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    headerSubtitle: { fontSize: 16, color: '#666', marginTop: 4 },
    card: { backgroundColor: 'white', borderRadius: 12, marginBottom: 20, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    cardTitle: { fontSize: 18, fontWeight: '600', marginLeft: 10 },
    orderItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    orderId: { flex: 1.2, fontSize: 14 },
    orderDate: { flex: 1, fontSize: 14, color: '#666', textAlign: 'center' },
    orderTotal: { flex: 1, fontSize: 14, fontWeight: 'bold', textAlign: 'right' },
    emptyText: { color: '#888', fontStyle: 'italic' },
    addressContent: { alignItems: 'flex-start' },
    addressText: { fontSize: 16, color: '#333', lineHeight: 24 },
    changeButton: { color: '#8E44AD', fontWeight: 'bold', marginTop: 10, fontSize: 16 },
    logoutButton: { flexDirection: 'row', backgroundColor: '#FF6B6B', padding: 15, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    logoutButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 5, paddingTop: 40 },
    closeButton: { position: 'absolute', top: 15, right: 15, padding: 5 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    modalOrderId: { fontSize: 14, color: '#888', marginBottom: 15, textAlign: 'center' },
    modalProductItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    modalProductText: { fontSize: 16 },
    modalTotalContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
    modalTotalText: { fontSize: 18, fontWeight: 'bold' },
    input: { height: 50, borderColor: '#BDBDBD', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 15, fontSize: 16, marginBottom: 20, width: '100%' },
    saveButton: { padding: 15, borderRadius: 30, alignItems: 'center' },
    saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    // Nuevos estilos para la sección de casilleros
    lockerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    lockerOrderId: { fontSize: 14, color: '#666' },
    lockerCode: { fontSize: 20, fontWeight: 'bold', color: '#8E44AD', letterSpacing: 3 },
});
