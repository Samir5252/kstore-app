// app/login.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { loginUser } from '@/api/userService'; 
import AsyncStorage from '@react-native-async-storage/async-storage';


// Icono de Google usando react-native-svg
const GoogleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path d="M19.53 10.22C19.53 9.53 19.47 8.87 19.35 8.24H10V11.9H15.45C15.22 13.23 14.48 14.37 13.37 15.14V17.58H16.58C18.49 15.82 19.53 13.22 19.53 10.22Z" fill="#4285F4"/>
    <Path d="M10 20C12.7 20 15.02 19.09 16.58 17.58L13.37 15.14C12.45 15.75 11.29 16.13 10 16.13C7.49 16.13 5.32 14.43 4.49 12.15H1.2V14.67C2.75 17.83 6.08 20 10 20Z" fill="#34A853"/>
    <Path d="M4.49 12.15C4.28 11.54 4.16 10.89 4.16 10.2C4.16 9.51 4.28 8.86 4.49 8.25V5.73H1.2C0.44 7.23 0 8.66 0 10.2C0 11.74 0.44 13.17 1.2 14.67L4.49 12.15Z" fill="#FBBC05"/>
    <Path d="M10 4.27C11.43 4.27 12.79 4.79 13.82 5.76L16.65 3C15.02 1.44 12.7 0.4 10 0.4C6.08 0.4 2.75 2.57 1.2 5.73L4.49 8.25C5.32 5.97 7.49 4.27 10 4.27Z" fill="#EA4335"/>
  </Svg>
);

// Icono para mostrar/ocultar contraseña
const EyeIcon = ({ isVisible }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <Path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {isVisible && <Path d="M2 2L22 22" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    </Svg>
);

// Componente de Input de Contraseña con el icono
const PasswordInput = ({ value, onChangeText, onSubmitEditing }) => {
    const [isPasswordSecure, setIsPasswordSecure] = useState(true);
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
            <TextInput
                style={styles.inputField}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={isPasswordSecure}
                onSubmitEditing={onSubmitEditing}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
            <TouchableOpacity onPress={() => setIsPasswordSecure(!isPasswordSecure)} style={styles.eyeIcon}>
                <EyeIcon isVisible={isPasswordSecure} />
            </TouchableOpacity>
        </View>
    );
};


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const router = useRouter();

  const handleEmailChange = (text) => {
    setEmail(text);
    setIsPasswordVisible(text.length > 0);
  };

  const handleLogin = async () => {
    if (!password) {
        Alert.alert('Error', 'Por favor, ingresa tu contraseña.');
        return;
    }
    setIsLoading(true);

    try {
        const response = await loginUser({
            email,
            password,
        });

        const { token } = response.data;
        await AsyncStorage.setItem('userToken', token);
        
        router.replace('/(tabs)');

    } catch (error) {
        console.error("Error en el inicio de sesión:", error.response?.data || error.message);
        Alert.alert('Error de autenticación', 'El e-mail o la contraseña son incorrectos. Por favor, inténtalo de nuevo.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <StatusBar barStyle="dark-content" />
          
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>LOGO</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Ingresa tu e-mail para iniciar sesión</Text>
            
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={[styles.input, isEmailFocused && styles.inputFocused]}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
            />

            {isPasswordVisible && (
              <>
                <Text style={styles.inputLabel}>Contraseña</Text>
                <PasswordInput
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity style={styles.continueButton} onPress={handleLogin} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.continueButtonText}>Iniciar Sesión</Text>}
                </TouchableOpacity>
                <TouchableOpacity>
                    <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* El footer ahora siempre es visible */}
          <View style={styles.footer}>
              {/* ▼▼▼ BOTÓN AÑADIDO ▼▼▼ */}
              <TouchableOpacity style={styles.createAccountButton} onPress={() => router.push('/register')}>
                  <Text style={styles.createAccountButtonText}>Crear cuenta</Text>
              </TouchableOpacity>
              
              <View style={styles.separatorContainer}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>o</Text>
                  <View style={styles.separatorLine} />
              </View>

              <TouchableOpacity style={styles.googleButton}>
                  <GoogleIcon />
                  <Text style={styles.googleButtonText}>Iniciar sesión con Google</Text>
              </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A0A0A0',
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: '400',
    marginBottom: 30,
    color: '#121212',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderColor: '#BDBDBD',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  inputFocused: {
    borderColor: '#C3B1E1',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#BDBDBD',
    borderWidth: 1.5,
    borderRadius: 8,
    marginBottom: 20,
    height: 50,
  },
  inputField: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 10,
  },
  continueButton: {
    backgroundColor: '#3466f6',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    height: 50,
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    width: '100%',
    marginTop: 20, // Añadido para dar espacio
  },
  createAccountButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  createAccountButtonText: {
    color: '#3466f6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  separatorText: {
    marginHorizontal: 10,
    color: '#888',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    paddingVertical: 15,
    borderRadius: 25,
  },
  googleButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  forgotPasswordText: {
      color: '#3466f6',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
  }
});
