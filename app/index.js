import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          // Si hay un token, redirige al usuario al home (dentro de las pestañas)
          router.replace('/(tabs)');
        } else {
          // Si no hay token, redirige al login
          router.replace('/login');
        }
      } catch (error) {
        console.error("Error al verificar el token:", error);
        // En caso de error, es más seguro enviar al login
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [router]);

  if (loading) {
    // Muestra un indicador de carga mientras se verifica el token
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Renderiza nulo mientras la redirección está en proceso
  return null;
}
