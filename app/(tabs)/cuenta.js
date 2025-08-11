import React, { useState, useCallback, useEffect } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
    ActivityIndicator, Modal, TextInput, 
    Platform, StatusBar, Animated, ScrollView
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getCurrentUser, updateUser } from '@/api/userService'; // Asegúrate que esta ruta sea correcta
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// --- Iconos para la UI ---
const UserIcon = ({ stroke = "#C3B1E1", width = 24, height = 24 }) => <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></Path><Circle cx="12" cy="7" r="4"></Circle></Svg>;
const EmailIcon = ({ stroke = "#C3B1E1" }) => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></Path><Path d="M22 6l-10 7L2 6"></Path></Svg>;
const MapPinIcon = ({ stroke = "#C3B1E1" }) => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></Path><Circle cx="12" cy="10" r="3"></Circle></Svg>;
const PhoneIcon = ({ stroke = "#C3B1E1" }) => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></Path></Svg>;
const EditIcon = () => <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C3B1E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></Path><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></Path></Svg>;
const LogOutIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></Path><Path d="M16 17l5-5-5-5"></Path><Path d="M21 12H9"></Path></Svg>;
const SuccessIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></Path><Path d="M22 4L12 14.01l-3-3"></Path></Svg>;
const ErrorIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 9v2m0 4h.01"></Path><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></Path></Svg>;

const CustomAlert = ({ visible, message, type, onHide }) => {
    const fadeAnim = useState(new Animated.Value(0))[0];
    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            const timer = setTimeout(() => {
                Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onHide());
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible]);
    if (!visible) return null;
    const backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
    const Icon = type === 'success' ? SuccessIcon : ErrorIcon;
    return (<Animated.View style={[styles.alertContainer, { opacity: fadeAnim, backgroundColor }]}><Icon /><Text style={styles.alertText}>{message}</Text></Animated.View>);
};

export default function AccountScreen() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [alert, setAlert] = useState({ visible: false, message: '', type: '' });
    const router = useRouter();
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');

    const showAlert = (message, type = 'error') => setAlert({ visible: true, message, type });

    const fetchUser = useCallback(async () => {
        try {
            const { data } = await getCurrentUser();
            setUser(data);
            setNewName(data.name || '');
            setNewEmail(data.email || '');
            setNewAddress(data.address || '');
            setNewPhone(data.phone || '');
        } catch (error) {
            console.error("Error al obtener datos del usuario:", error);
            handleLogout();
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { setLoading(true); fetchUser(); }, [fetchUser]));

    const handleLogout = async () => {
        await AsyncStorage.removeItem('userToken');
        router.replace('/login');
    };

    const openModal = (type) => {
        setModalContent(type);
        setCurrentPassword('');
        setModalVisible(true);
    };

    const handleUpdate = async () => {
        let updateData = {};
        switch (modalContent) {
            case 'name':
                if (!newName.trim()) return showAlert("El nombre no puede estar vacío.");
                updateData = { name: newName };
                break;
            case 'address':
                updateData = { address: newAddress };
                break;
            case 'phone':
                updateData = { phone: newPhone };
                break;
            case 'email':
                if (!newEmail.trim() || !currentPassword.trim()) return showAlert("Completa todos los campos para cambiar el email.");
                updateData = { newEmail, currentPassword };
                break;
            default: return;
        }
        try {
            await updateUser(updateData);
            showAlert("Información actualizada con éxito.", 'success');
            setModalVisible(false);
            fetchUser();
        } catch (error) {
            showAlert(error.response?.data?.message || "No se pudo actualizar.");
        }
    };

    const renderModal = () => {
        let title = '';
        let content = null;
        switch (modalContent) {
            case 'name':
                title = 'Cambiar Nombre';
                content = <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Nuevo nombre" placeholderTextColor="#6E6E73" autoCapitalize="words" />;
                break;
            case 'address':
                title = 'Cambiar Dirección';
                content = <TextInput style={styles.input} value={newAddress} onChangeText={setNewAddress} placeholder="Nueva dirección" placeholderTextColor="#6E6E73" autoCapitalize="sentences" />;
                break;
            case 'phone':
                title = 'Cambiar Teléfono';
                content = <TextInput style={styles.input} value={newPhone} onChangeText={setNewPhone} placeholder="Nuevo teléfono" placeholderTextColor="#6E6E73" keyboardType="phone-pad" />;
                break;
            case 'email':
                title = 'Cambiar Email';
                content = (<><TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} placeholder="Nuevo email" placeholderTextColor="#6E6E73" keyboardType="email-address" autoCapitalize="none" /><TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Contraseña actual para confirmar" placeholderTextColor="#6E6E73" secureTextEntry /></>);
                break;
        }
        return (<Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}><View style={styles.modalContainer}><View style={styles.modalContent}><Text style={styles.modalTitle}>{title}</Text>{content}<TouchableOpacity onPress={handleUpdate}><LinearGradient colors={['#D0B3E5', '#C3B1E1']} style={styles.modalButton}><Text style={styles.modalButtonText}>Guardar Cambios</Text></LinearGradient></TouchableOpacity><TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setModalVisible(false)}><Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>Cancelar</Text></TouchableOpacity></View></View></Modal>);
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#C3B1E1" /></View>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <CustomAlert visible={alert.visible} message={alert.message} type={alert.type} onHide={() => setAlert({ ...alert, visible: false })} />
            {renderModal()}
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.profileHeader}>
                    <Text style={styles.headerTitle}>Hola, {user?.name}</Text>
                    <Text style={styles.headerSubtitle}>Gestiona tu información personal</Text>
                </View>
                
                <View style={styles.card}>
                    <InfoRow icon={<UserIcon />} label="Nombre" value={user?.name} onEdit={() => openModal('name')} />
                    <InfoRow icon={<EmailIcon />} label="Email" value={user?.email} onEdit={() => openModal('email')} />
                    <InfoRow icon={<MapPinIcon />} label="Dirección" value={user?.address || 'No especificada'} onEdit={() => openModal('address')} />
                    <InfoRow icon={<PhoneIcon />} label="Teléfono" value={user?.phone || 'No especificado'} onEdit={() => openModal('phone')} isLast />
                </View>

                <View style={{ flex: 1, minHeight: 50 }} />

                <TouchableOpacity onPress={handleLogout}>
                    <LinearGradient colors={['#FF6B6B', '#FF4757']} style={styles.logoutButton}>
                        <LogOutIcon />
                        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const InfoRow = ({ label, value, onEdit, isLast = false, icon }) => (
    <View style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}>
        <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
            <View style={styles.iconContainer}>{icon}</View>
            <View style={{flex: 1, marginLeft: 15}}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
            </View>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <EditIcon />
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F7F8FA', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F7FA' },
    container: { flexGrow: 1, padding: 20 },
    
    profileHeader: { alignItems: 'center', marginBottom: 40 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1D1D1F' },
    headerSubtitle: { fontSize: 18, color: '#6E6E73', marginTop: 5 },
    
    card: { 
        backgroundColor: 'white', 
        borderRadius: 20, 
        paddingVertical: 10,
        paddingHorizontal: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5,
    },
    infoRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingVertical: 20, 
        borderBottomWidth: 1, 
        borderBottomColor: '#F0EEF2'
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#F5F3F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: { fontSize: 15, color: '#6E6E73' },
    infoValue: { fontSize: 17, color: '#1D1D1F', fontWeight: '600', marginTop: 4 },
    editButton: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: '#F5F3F7',
    },
    
    logoutButton: { 
        flexDirection: 'row', 
        padding: 18, 
        borderRadius: 30, 
        alignItems: 'center', 
        justifyContent: 'center', 
        shadowColor: "#FF6B6B", 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 5, 
        elevation: 6 
    },
    logoutButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
    
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1D1D1F' },
    input: { backgroundColor: '#F5F5F5', color: '#1D1D1F', borderWidth: 1, borderColor: '#EAEAEA', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16 },
    modalButton: { padding: 15, borderRadius: 12, alignItems: 'center' },
    modalButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    modalButtonCancel: { backgroundColor: '#F0F0F0', marginTop: 10 },
    modalButtonTextCancel: { color: '#6E6E73', fontWeight: 'bold' },

    alertContainer: { position: 'absolute', top: 60, left: 20, right: 20, padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', zIndex: 1000, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    alertText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
});
