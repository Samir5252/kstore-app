// app/register.js
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { registerUser } from '@/api/userService';
import Svg, { Path } from 'react-native-svg';

// Icono para mostrar/ocultar contraseña
const EyeIcon = ({ isVisible }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <Path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {isVisible && <Path d="M2 2L22 22" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    </Svg>
);

// Componente de Input de Contraseña reutilizable
const PasswordInput = React.forwardRef(({ value, onChangeText, onSubmitEditing }, ref) => {
    const [isPasswordSecure, setIsPasswordSecure] = useState(true);
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
            <TextInput
                ref={ref}
                style={styles.inputField}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={isPasswordSecure}
                onSubmitEditing={onSubmitEditing}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                returnKeyType="done"
            />
            <TouchableOpacity onPress={() => setIsPasswordSecure(!isPasswordSecure)} style={styles.eyeIcon}>
                <EyeIcon isVisible={isPasswordSecure} />
            </TouchableOpacity>
        </View>
    );
});


export default function RegisterScreen() {
  const [name, setname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para el focus de los inputs
  const [isnameFocused, setIsnameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const router = useRouter();

  // Referencias para manejar el foco entre inputs
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }
    setIsLoading(true);

    try {
      await registerUser({
        name,
        email,
        password,
      });

      Alert.alert(
        '¡Registro Exitoso!',
        'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );

    } catch (error) {
      console.error("Error en el registro:", error.response?.data || error.message);
      Alert.alert('Error en el registro', error.response?.data?.message || 'No se pudo crear la cuenta. Inténtalo de nuevo.');
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
          
          {/* ▼▼▼ APARTADO PARA EL LOGO ▼▼▼ */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>LOGO</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Crea tu cuenta</Text>
            
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={[styles.input, isnameFocused && styles.inputFocused]}
              value={name}
              onChangeText={setname}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailInputRef.current?.focus()}
              onFocus={() => setIsnameFocused(true)}
              onBlur={() => setIsnameFocused(false)}
            />

            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              ref={emailInputRef}
              style={[styles.input, isEmailFocused && styles.inputFocused]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
            />

            <Text style={styles.inputLabel}>Contraseña</Text>
            <PasswordInput
              ref={passwordInputRef}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleRegister}
            />

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.registerButtonText}>Crear cuenta</Text>}
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
        paddingBottom: 20,
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
        fontSize: 28,
        fontWeight: 'bold',
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
        borderColor: '#C3B1E1', // Lila pastel para el focus
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
    registerButton: {
        backgroundColor: '#3466f6',
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 10,
        height: 50,
        justifyContent: 'center',
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
