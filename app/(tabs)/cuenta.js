import React, { useState, useCallback, useEffect, } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
    ActivityIndicator, Modal, TextInput, 
    LayoutAnimation, Platform, StatusBar, UIManager, Animated
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getCurrentUser, updateUser } from '@/api/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// Habilitar LayoutAnimation para Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Iconos para la UI ---
const UserIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></Path><Path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></Path></Svg>;
const BoxIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></Path><Path d="M3.27 6.96L12 12.01l8.73-5.05"></Path><Path d="M12 22.08V12"></Path></Svg>;
const MapPinIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></Path><Path d="M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></Path></Svg>;
const ChevronDown = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M6 9l6 6 6-6"></Path></Svg>;
const ChevronUp = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M18 15l-6-6-6 6"></Path></Svg>;
const LogOutIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></Path><Path d="M16 17l5-5-5-5"></Path><Path d="M21 12H9"></Path></Svg>;
const SuccessIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></Path><Path d="M22 4L12 14.01l-3-3"></Path></Svg>;
const ErrorIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 9v2m0 4h.01"></Path><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></Path></Svg>;

// --- Componente de Alerta Personalizada (Toast) ---
const CustomAlert = ({ visible, message, type, onHide }) => {
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
            setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => onHide());
            }, 3000); // Ocultar después de 3 segundos
        }
    }, [visible]);

    if (!visible) return null;

    const backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
    const Icon = type === 'success' ? SuccessIcon : ErrorIcon;

    return (
        <Animated.View style={[styles.alertContainer, { opacity: fadeAnim, backgroundColor }]}>
            <Icon />
            <Text style={styles.alertText}>{message}</Text>
        </Animated.View>
    );
};

// --- Componente de Acordeón Reutilizable ---
const AccordionItem = ({ title, icon, children }) => {
    const [expanded, setExpanded] = useState(false);
    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };
    return (
        <View style={styles.card}>
            <TouchableOpacity style={styles.accordionHeader} onPress={toggleExpand}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {icon}
                    <Text style={styles.accordionTitle}>{title}</Text>
                </View>
                {expanded ? <ChevronUp /> : <ChevronDown />}
            </TouchableOpacity>
            {expanded && <View style={styles.accordionContent}>{children}</View>}
        </View>
    );
};

// --- Componente de Botón Grande ---
const LargeOptionButton = ({ title, icon, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.largeButtonContent}>
            {icon}
            <Text style={styles.accordionTitle}>{title}</Text>
        </View>
    </TouchableOpacity>
);

export default function AccountScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const [alert, setAlert] = useState({ visible: false, message: '', type: '' });
  const router = useRouter();

  const showAlert = (message, type = 'error') => {
    setAlert({ visible: true, message, type });
  };

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await getCurrentUser();
      setUser(data);
      setNewName(data.name);
      setNewEmail(data.email);
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); fetchUser(); }, []));

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    router.replace('/login');
  };

  const openModal = (type) => {
    setModalContent(type);
    setModalVisible(true);
  };

  const handleUpdate = async () => {
    let updateData = {};
    if (modalContent === 'name') {
      if (!newName.trim()) return showAlert("El nombre no puede estar vacío.");
      updateData = { name: newName };
    } else if (modalContent === 'email') {
      if (!newEmail.trim() || !currentPassword.trim()) return showAlert("Completa todos los campos.");
      updateData = { newEmail, currentPassword };
    }

    try {
      await updateUser(updateData);
      showAlert("Información actualizada con éxito.", 'success');
      setModalVisible(false);
      setCurrentPassword('');
      fetchUser();
    } catch (error) {
      showAlert(error.response?.data?.message || "No se pudo actualizar.");
    }
  };

  const renderModal = () => (
    <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {modalContent === 'name' && (<><Text style={styles.modalTitle}>Cambiar Nombre</Text><TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Nuevo nombre" /></>)}
          {modalContent === 'email' && (<><Text style={styles.modalTitle}>Cambiar Email</Text><TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} placeholder="Nuevo email" keyboardType="email-address" /><TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Contraseña actual" secureTextEntry /></>)}
          <TouchableOpacity onPress={handleUpdate}>
              <LinearGradient colors={['#D0B3E5', '#C3B1E1']} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Guardar Cambios</Text>
              </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomAlert visible={alert.visible} message={alert.message} type={alert.type} onHide={() => setAlert({ ...alert, visible: false })} />
      {renderModal()}
      <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Hola, {user?.name}</Text>
            <Text style={styles.headerSubtitle}>Gestiona tu información y pedidos</Text>
        </View>
        
        <AccordionItem title="Información de la cuenta" icon={<UserIcon />}>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Nombre</Text><Text style={styles.infoValue}>{user?.name}</Text><TouchableOpacity onPress={() => openModal('name')}><Text style={styles.changeButton}>Cambiar</Text></TouchableOpacity></View>
            <View style={[styles.infoRow, {borderBottomWidth: 0}]}><Text style={styles.infoLabel}>Email</Text><Text style={styles.infoValue}>{user?.email}</Text><TouchableOpacity onPress={() => openModal('email')}><Text style={styles.changeButton}>Cambiar</Text></TouchableOpacity></View>
        </AccordionItem>

        <LargeOptionButton title="Mis Pedidos" icon={<BoxIcon />} onPress={() => { /* Navegar a Pedidos */ }} />
        
        <AccordionItem title="Mis Direcciones" icon={<MapPinIcon />}>
            <Text style={styles.placeholderText}>Aquí podrás gestionar tus direcciones de envío.</Text>
        </AccordionItem>

        <View style={{flex: 1}} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOutIcon />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F7F8FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 30 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  
  card: { backgroundColor: 'white', borderRadius: 12, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  accordionTitle: { fontSize: 16, fontWeight: '600', marginLeft: 15 },
  accordionContent: { paddingHorizontal: 20, paddingBottom: 20 },
  
  largeButtonContent: { flexDirection: 'row', alignItems: 'center', padding: 25 },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  infoLabel: { fontSize: 14, color: '#666', width: '25%' },
  infoValue: { fontSize: 14, flex: 1 },
  changeButton: { color: '#C3B1E1', fontWeight: 'bold' },
  placeholderText: { color: '#888', fontStyle: 'italic' },
  
  logoutButton: { flexDirection: 'row', backgroundColor: '#FF6B6B', padding: 15, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3.84, elevation: 5 },
  logoutButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  
  // Modal Styles
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#CCC', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  modalButton: { padding: 15, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalButtonCancel: { backgroundColor: '#F5F5F5', marginTop: 10 },
  modalButtonTextCancel: { color: '#FF6B6B', fontWeight: 'bold' },

  // Alert (Toast) Styles
  alertContainer: { position: 'absolute', top: 50, left: 20, right: 20, padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', zIndex: 1000 },
  alertText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
});
