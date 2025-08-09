import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { forgotPasswordRequest, resetPasswordWithCode } from '@/api/userService';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

// --- Iconos y Componentes ---
const EmailIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></Path><Path d="M22 6l-10 7L2 6"></Path></Svg>;
const LockIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M7 11V7a5 5 0 0 1 10 0v4"></Path><Path d="M5 11h14v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V11z"></Path></Svg>;
const SuccessIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></Path><Path d="M22 4L12 14.01l-3-3"></Path></Svg>;
const ErrorIcon = () => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></Path><Path d="M12 9v4"></Path><Path d="M12 17h.01"></Path></Svg>;

const CustomAlert = ({ visible, message, type, onHide }) => {
    const fadeAnim = useState(new Animated.Value(0))[0];
    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            setTimeout(() => {
                Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onHide());
            }, 4000);
        }
    }, [visible]);
    if (!visible) return null;
    const backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
    const Icon = type === 'success' ? SuccessIcon : ErrorIcon;
    return (<Animated.View style={[styles.alertContainer, { opacity: fadeAnim, backgroundColor }]}><Icon /><Text style={styles.alertText}>{message}</Text></Animated.View>);
};

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(new Array(6).fill(''));
    const [newPassword, setNewPassword] = useState('');
    const [stage, setStage] = useState('request');
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ visible: false, message: '', type: '' });
    const router = useRouter();
    const codeInputs = useRef([]);

    const showAlert = (message, type = 'error') => setAlert({ visible: true, message, type });

    const handleCodeChange = (text, index) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);
    
        if (text && index < 5) {
          codeInputs.current[index + 1].focus();
        }
    
        if (text.length > 1 && index === 0) {
            const pastedCode = text.split('').slice(0, 6);
            const filledCode = [...pastedCode, ...new Array(6 - pastedCode.length).fill('')];
            setCode(filledCode);
            if (pastedCode.length === 6) {
                codeInputs.current[5].focus();
            }
        }
    };
    
    const handleBackspace = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            codeInputs.current[index - 1].focus();
        }
    };

    const handleRequestCode = async () => {
        if (!email) {
            showAlert('Por favor, ingresa tu correo electrónico.');
            return;
        }
        setIsLoading(true);
        try {
            await forgotPasswordRequest(email);
            showAlert('Código enviado. Revisa tu correo (y la carpeta de spam).', 'success');
            setStage('verify');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'No se pudo enviar el código. Intenta de nuevo.';
            showAlert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleResetPassword = async () => {
        const finalCode = code.join('');
        if (finalCode.length !== 6 || !newPassword) {
            showAlert('Por favor, completa todos los campos.');
            return;
        }
        setIsLoading(true);
        try {
            await resetPasswordWithCode(email, finalCode, newPassword);
            showAlert('¡Contraseña actualizada con éxito!', 'success');
            setTimeout(() => {
                router.replace('/login');
            }, 2500);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'No se pudo restablecer la contraseña.';
            showAlert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: 'Recuperar Contraseña', headerBackTitle: 'Login' }} />
            <CustomAlert visible={alert.visible} message={alert.message} type={alert.type} onHide={() => setAlert({ ...alert, visible: false })} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.container}>
                    <StatusBar barStyle="dark-content" />

                    <View style={styles.logoContainer}><Text style={styles.logoText}>K-STORE</Text></View>

                    <View style={styles.header}>
                        <Text style={styles.title}>{stage === 'request' ? 'Recupera tu Acceso' : 'Verifica tu Identidad'}</Text>
                        <Text style={styles.subtitle}>
                            {stage === 'request'
                                ? 'Ingresa tu correo y te enviaremos un código para restablecer tu contraseña.'
                                : `Ingresa el código que enviamos a ${email} y tu nueva contraseña.`}
                        </Text>
                    </View>

                    {stage === 'request' && (
                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <EmailIcon />
                                <TextInput style={styles.inputField} value={email} onChangeText={setEmail} placeholder="Tu correo electrónico" placeholderTextColor="#888" keyboardType="email-address" autoCapitalize="none" onSubmitEditing={handleRequestCode} />
                            </View>
                            <TouchableOpacity onPress={handleRequestCode} disabled={isLoading}>
                                <LinearGradient colors={['#D0B3E5', '#C3B1E1']} style={styles.button}>
                                    {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Enviar Código</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}

                    {stage === 'verify' && (
                        <View style={styles.formContainer}>
                            <View style={styles.codeInputContainer}>
                                {code.map((digit, index) => (
                                    <TextInput
                                        key={index}
                                        ref={ref => codeInputs.current[index] = ref}
                                        style={styles.codeInput}
                                        value={digit}
                                        onChangeText={(text) => handleCodeChange(text, index)}
                                        onKeyPress={(e) => handleBackspace(e, index)}
                                        keyboardType="number-pad"
                                        maxLength={index === 0 ? 6 : 1} // Permite pegar el código en el primer input
                                        textAlign="center"
                                    />
                                ))}
                            </View>
                            <View style={styles.inputContainer}>
                                <LockIcon />
                                <TextInput style={styles.inputField} value={newPassword} onChangeText={setNewPassword} placeholder="Nueva contraseña" placeholderTextColor="#888" secureTextEntry onSubmitEditing={handleResetPassword} />
                            </View>
                            <TouchableOpacity onPress={handleResetPassword} disabled={isLoading}>
                                <LinearGradient colors={['#D0B3E5', '#C3B1E1']} style={styles.button}>
                                    {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Restablecer Contraseña</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
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
    header: { alignItems: 'center', marginBottom: 40 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#121212', textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#888', marginTop: 15, textAlign: 'center' },
    formContainer: { width: '100%' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 15, marginBottom: 20, height: 55, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
    inputField: { flex: 1, fontSize: 16, marginLeft: 10, color: '#000' },
    button: { paddingVertical: 15, borderRadius: 30, alignItems: 'center', justifyContent: 'center', height: 55 },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    codeInputContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    codeInput: {
        width: 45,
        height: 55,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#BDBDBD',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
    },
    alertContainer: { position: 'absolute', top: 60, left: 20, right: 20, padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', zIndex: 1000, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    alertText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
});