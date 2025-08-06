import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, LayoutAnimation, UIManager, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { loginUser, googleLogin } from '@/api/userService'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// Esto es necesario para que el flujo de autenticación de Google funcione correctamente en Expo Go.
WebBrowser.maybeCompleteAuthSession();

// Habilitar LayoutAnimation para Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Iconos y Componentes ---
const GoogleIcon = () => <Svg width="20" height="20" viewBox="0 0 20 20" fill="none"><Path d="M19.53 10.22C19.53 9.53 19.47 8.87 19.35 8.24H10V11.9H15.45C15.22 13.23 14.48 14.37 13.37 15.14V17.58H16.58C18.49 15.82 19.53 13.22 19.53 10.22Z" fill="#4285F4"/><Path d="M10 20C12.7 20 15.02 19.09 16.58 17.58L13.37 15.14C12.45 15.75 11.29 16.13 10 16.13C7.49 16.13 5.32 14.43 4.49 12.15H1.2V14.67C2.75 17.83 6.08 20 10 20Z" fill="#34A853"/><Path d="M4.49 12.15C4.28 11.54 4.16 10.89 4.16 10.2C4.16 9.51 4.28 8.86 4.49 8.25V5.73H1.2C0.44 7.23 0 8.66 0 10.2C0 11.74 0.44 13.17 1.2 14.67L4.49 12.15Z" fill="#FBBC05"/><Path d="M10 4.27C11.43 4.27 12.79 4.79 13.82 5.76L16.65 3C15.02 1.44 12.7 0.4 10 0.4C6.08 0.4 2.75 2.57 1.2 5.73L4.49 8.25C5.32 5.97 7.49 4.27 10 4.27Z" fill="#EA4335"/></Svg>;
const EyeIcon = ({ isVisible }) => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none"><Path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>{isVisible && <Path d="M2 2L22 22" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}</Svg>;
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
            }, 3000);
        }
    }, [visible]);
    if (!visible) return null;
    const backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
    const Icon = type === 'success' ? SuccessIcon : ErrorIcon;
    return (<Animated.View style={[styles.alertContainer, { opacity: fadeAnim, backgroundColor }]}><Icon /><Text style={styles.alertText}>{message}</Text></Animated.View>);
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, message: '', type: '' });
  const [isGoogleAvailable, setIsGoogleAvailable] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const router = useRouter();

  // --- Configuración mejorada de Google Sign-In ---
  // Verificar si estamos en Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';
  
  // ⚠️ SOLO PARA PRUEBAS - Reemplaza con tus credenciales reales
  const GOOGLE_WEB_CLIENT_ID = "19800360417-22kkjoacj6iul1cqq5ledasruhk7fs011m.apps.googleusercontent.com";
  const GOOGLE_ANDROID_CLIENT_ID = "19800360417-odlbo847sasasaskd3tiu0uqmvhncu4.apps.googleusercontent.com";
  
  // Configuración de Google Auth - Sin redirectUri personalizado para que use el automático
  const googleConfig = {
    expoClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    // Dejar que Expo maneje automáticamente el redirectUri
    // iOS (opcional)
    // iosClientId: "TU_CLIENT_ID_IOS.apps.googleusercontent.com",
  };

  // Los hooks DEBEN ejecutarse siempre, no pueden estar en try-catch
  let request, response, promptAsync;
  
  try {
    [request, response, promptAsync] = Google.useIdTokenAuthRequest(googleConfig);
  } catch (error) {
    console.error('Error inicializando Google Auth:', error);
    request = null;
    response = null;
    promptAsync = null;
  }

  // Verificar disponibilidad después del hook
  useEffect(() => {
    if (request && GOOGLE_WEB_CLIENT_ID && GOOGLE_ANDROID_CLIENT_ID) {
      setIsGoogleAvailable(true);
      // Mostrar el redirectUri que se está usando
      console.log('Google Auth disponible. RedirectUri automático:', request?.redirectUri);
    } else {
      setIsGoogleAvailable(false);
      console.warn('Google Auth no disponible - verifique credenciales');
    }
  }, [request]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    } else if (response?.type === 'error') {
      console.error('Error en Google Auth:', response.error);
      showAlert('Error al iniciar sesión con Google');
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken) => {
    setIsLoading(true);
    try {
        const { data } = await googleLogin(idToken);
        await AsyncStorage.setItem('userToken', data.token);
        showAlert('¡Inicio de sesión exitoso!', 'success');
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1500);
    } catch (error) {
        console.error("Error en el inicio de sesión con Google:", error.response?.data || error.message);
        showAlert('No se pudo iniciar sesión con Google.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsPasswordVisible(text.length > 0);
  };

  const showAlert = (message, type = 'error') => {
    setAlert({ visible: true, message, type });
  };

  const handleLogin = async () => {
    if (!password) {
      showAlert('Por favor, ingresa tu contraseña.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await loginUser({ email, password });
      const { token } = response.data;
      await AsyncStorage.setItem('userToken', token);
      showAlert('¡Inicio de sesión exitoso!', 'success');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);
    } catch (error) {
      console.error("Error en el inicio de sesión:", error.response?.data || error.message);
      showAlert(error.response?.data?.message || 'Credenciales incorrectas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGooglePress = () => {
    if (!isGoogleAvailable || !request || !promptAsync) {
      if (isExpoGo) {
        showAlert('Google Auth requiere credenciales de Android. Verifica tu configuración.');
      } else {
        showAlert('Google Auth no está disponible en este momento.');
      }
      return;
    }
    
    try {
      promptAsync();
    } catch (error) {
      console.error('Error al ejecutar Google Auth:', error);
      showAlert('Error al inicializar Google Auth');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomAlert visible={alert.visible} message={alert.message} type={alert.type} onHide={() => setAlert({ ...alert, visible: false })} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <StatusBar barStyle="dark-content" />
          
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>K-STORE</Text>
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Bienvenido de Vuelta</Text>
              <Text style={styles.subtitle}>Inicia sesión para continuar tu aventura K-Pop.</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <EmailIcon />
                <TextInput
                  style={styles.inputField}
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {isPasswordVisible && (
                <View style={styles.inputContainer}>
                  <LockIcon />
                  <TextInput
                    style={styles.inputField}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Contraseña"
                    secureTextEntry={isPasswordSecure}
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity onPress={() => setIsPasswordSecure(!isPasswordSecure)} style={styles.eyeIcon}>
                    <EyeIcon isVisible={isPasswordSecure} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity onPress={handleLogin} disabled={isLoading || !isPasswordVisible}>
              <LinearGradient colors={isPasswordVisible ? ['#D0B3E5', '#C3B1E1'] : ['#E0E0E0', '#D1D1D1']} style={styles.loginButton}>
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loginButtonText}>Iniciar Sesión</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.linksContainer}>
                <TouchableOpacity style={{ marginBottom: 15 }} onPress={() => router.push('/register')}>
                    <Text style={styles.linkText}>Crear cuenta</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>o</Text>
              <View style={styles.separatorLine} />
            </View>

            <TouchableOpacity 
              style={[
                styles.googleButton, 
                (!isGoogleAvailable || isLoading) && styles.googleButtonDisabled
              ]} 
              disabled={isLoading}
              onPress={handleGooglePress}
            >
              <GoogleIcon />
              <Text style={[
                styles.googleButtonText,
                (!isGoogleAvailable || isLoading) && styles.googleButtonTextDisabled
              ]}>
                {isExpoGo && !isGoogleAvailable 
                  ? 'Google (No disponible en Expo Go)' 
                  : 'Continuar con Google'
                }
              </Text>
            </TouchableOpacity>

            {isExpoGo && !isGoogleAvailable && (
              <Text style={styles.warningText}>
                💡 Para usar Google Auth en Android, necesitas crear credenciales específicas de Android en Google Console
              </Text>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F7FA' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 25 },
  content: { width: '100%' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#C3B1E1' },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#121212' },
  subtitle: { fontSize: 16, color: '#888', marginTop: 8 },
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
  inputField: { flex: 1, fontSize: 16, marginLeft: 10 },
  eyeIcon: { padding: 5 },
  loginButton: { paddingVertical: 15, borderRadius: 30, alignItems: 'center', justifyContent: 'center', height: 55, shadowColor: "#C3B1E1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  linksContainer: { 
    flexDirection: 'column', 
    alignItems: 'center',
    marginTop: 20 
  },
  linkText: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  separatorText: { marginHorizontal: 10, color: '#AAA' },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#E0E0E0', paddingVertical: 15, borderRadius: 30, height: 55 },
  googleButtonText: { marginLeft: 10, fontSize: 16, fontWeight: '600', color: '#333' },
  googleButtonDisabled: { backgroundColor: '#F5F5F5', borderColor: '#D0D0D0' },
  googleButtonTextDisabled: { color: '#999' },
  alertContainer: { position: 'absolute', top: 60, left: 20, right: 20, padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', zIndex: 1000, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  alertText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  warningText: { textAlign: 'center', fontSize: 12, color: '#666', marginTop: 10, fontStyle: 'italic' },
});