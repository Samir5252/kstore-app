import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { registerUser } from '@/api/userService';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// --- Iconos ---
const UserIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></Path><Path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></Path></Svg>;
const EmailIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></Path><Path d="M22 6l-10 7L2 6"></Path></Svg>;
const LockIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M7 11V7a5 5 0 0 1 10 0v4"></Path><Path d="M5 11h14v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V11z"></Path></Svg>;
const EyeIcon = ({ isVisible }) => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>{isVisible && <Path d="M2 2L22 22" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}</Svg>;
const SuccessIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></Path><Path d="M22 4L12 14.01l-3-3"></Path></Svg>;
const ErrorIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></Path><Path d="M12 9v4"></Path><Path d="M12 17h.01"></Path></Svg>;

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

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordSecure, setIsPasswordSecure] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ visible: false, message: '', type: '' });
    const router = useRouter();

    const emailInputRef = useRef(null);
    const passwordInputRef = useRef(null);
    
    const showAlert = (message, type = 'error') => {
        setAlert({ visible: true, message, type });
    };

    const handleRegister = async () => {
        if (!name || !email || !password) {
            showAlert('Por favor, completa todos los campos.');
            return;
        }
        setIsLoading(true);

        try {
            await registerUser({ name, email, password });
            showAlert('¡Cuenta creada! Serás redirigido al inicio de sesión.', 'success');
            setTimeout(() => {
                router.replace('/login');
            }, 2500);

        } catch (error) {
            console.error("Error en el registro:", error.response?.data || error.message);
            showAlert(error.response?.data?.message || 'No se pudo crear la cuenta.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <CustomAlert visible={alert.visible} message={alert.message} type={alert.type} onHide={() => setAlert({ ...alert, visible: false })} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.container}>
                    <StatusBar barStyle="dark-content" />
                    
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>K-STORE</Text>
                    </View>

                    <View style={styles.header}>
                        <Text style={styles.title}>Crea tu Cuenta</Text>
                        <Text style={styles.subtitle}>Únete a la comunidad K-Pop más grande.</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <UserIcon />
                            <TextInput
                                style={styles.inputField}
                                value={name}
                                onChangeText={setName}
                                placeholder="Nombre completo"
                                placeholderTextColor="#888"
                                autoCapitalize="words"
                                returnKeyType="next"
                                onSubmitEditing={() => emailInputRef.current?.focus()}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <EmailIcon />
                            <TextInput
                                ref={emailInputRef}
                                style={styles.inputField}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email"
                                placeholderTextColor="#888"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                returnKeyType="next"
                                onSubmitEditing={() => passwordInputRef.current?.focus()}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <LockIcon />
                            <TextInput
                                ref={passwordInputRef}
                                style={styles.inputField}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Contraseña"
                                placeholderTextColor="#888"
                                secureTextEntry={isPasswordSecure}
                                returnKeyType="done"
                                onSubmitEditing={handleRegister}
                            />
                            <TouchableOpacity onPress={() => setIsPasswordSecure(!isPasswordSecure)} style={styles.eyeIcon}>
                                <EyeIcon isVisible={isPasswordSecure} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity onPress={handleRegister} disabled={isLoading}>
                        <LinearGradient colors={['#D0B3E5', '#C3B1E1']} style={styles.registerButton}>
                            {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.registerButtonText}>Crear Cuenta</Text>}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.linksContainer}>
                        <TouchableOpacity onPress={() => router.replace('/login')}>
                            <Text style={styles.linkText}>¿Ya tienes una cuenta? <Text style={{fontWeight: 'bold'}}>Inicia sesión</Text></Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F7FA' },
    container: { flexGrow: 1, justifyContent: 'center', padding: 25 },
    logoContainer: { alignItems: 'center', marginBottom: 40 },
    logoText: { fontSize: 32, fontWeight: 'bold', color: '#C3B1E1' },
    header: { alignItems: 'center', marginBottom: 30 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#121212' },
    subtitle: { fontSize: 16, color: '#888', marginTop: 8, textAlign: 'center' },
    formContainer: { marginBottom: 20 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 55,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    inputField: {
        flex: 1,
        fontSize: 16,
        marginLeft: 10,
        color: '#000'
    },
    eyeIcon: { padding: 5 },
    registerButton: {
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        height: 55,
        shadowColor: "#C3B1E1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    registerButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    linksContainer: {
        alignItems: 'center',
        marginTop: 25,
    },
    linkText: {
        color: '#007AFF',
        fontSize: 14,
    },
    alertContainer: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1000,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    alertText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
});