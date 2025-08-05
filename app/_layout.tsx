import { Stack } from 'expo-router';
import { CartProvider } from '@/context/CartContext'; // 1. Importa el Provider

export default function RootLayout() {
  return (
    // 2. Envuelve toda la aplicación con el CartProvider
    <CartProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title:'' }} />
        <Stack.Screen name="register" options={{ title: 'Se Parte de nuestra familia' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ title: 'Detalles' }} />
      </Stack>
    </CartProvider>
  );
}
