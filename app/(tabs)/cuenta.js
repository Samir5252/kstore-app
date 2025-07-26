import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Button } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getCurrentUser, updateUser } from '@/api/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AccountScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState(null); // 'name' o 'email'
  
  // Estados para los formularios del modal
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await getCurrentUser();
      setUser(data);
      setNewName(data.name);
      setNewEmail(data.email);
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      handleLogout(); // Si hay error (ej. token inválido), cerramos sesión
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchUser();
    }, [])
  );

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
      if (!newName.trim()) {
        Alert.alert("Error", "El nombre no puede estar vacío.");
        return;
      }
      updateData = { name: newName };
    } else if (modalContent === 'email') {
      if (!newEmail.trim() || !currentPassword.trim()) {
        Alert.alert("Error", "Completa todos los campos para cambiar el email.");
        return;
      }
      updateData = { newEmail, currentPassword };
    }

    try {
      await updateUser(updateData);
      Alert.alert("Éxito", "Tu información ha sido actualizada.");
      setModalVisible(false);
      setCurrentPassword(''); // Limpiar contraseña
      fetchUser(); // Refrescar los datos del usuario
    } catch (error) {
      console.error("Error al actualizar:", error.response?.data);
      Alert.alert("Error", error.response?.data?.message || "No se pudo actualizar la información.");
    }
  };

  const renderModal = () => (
    <Modal visible={isModalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {modalContent === 'name' && (
            <>
              <Text style={styles.modalTitle}>Cambiar Nombre</Text>
              <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Nuevo nombre" />
            </>
          )}
          {modalContent === 'email' && (
            <>
              <Text style={styles.modalTitle}>Cambiar Email</Text>
              <TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} placeholder="Nuevo email" keyboardType="email-address" />
              <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Contraseña actual" secureTextEntry />
            </>
          )}
          <Button title="Guardar Cambios" onPress={handleUpdate} />
          <View style={{ marginTop: 10 }}>
            <Button title="Cancelar" onPress={() => setModalVisible(false)} color="gray" />
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderModal()}
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Mi Cuenta</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la cuenta</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre</Text>
            <Text style={styles.infoValue}>{user?.name}</Text>
            <TouchableOpacity onPress={() => openModal('name')}>
              <Text style={styles.changeButton}>Cambiar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
            <TouchableOpacity onPress={() => openModal('email')}>
              <Text style={styles.changeButton}>Cambiar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  section: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  infoLabel: { fontSize: 16, color: '#666', width: '25%' },
  infoValue: { fontSize: 16, flex: 1 },
  changeButton: { color: '#007AFF', fontWeight: 'bold' },
  logoutButton: { backgroundColor: '#FF3B30', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  logoutButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  // Modal Styles
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 10, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#CCC', padding: 10, borderRadius: 5, marginBottom: 15 },
});
