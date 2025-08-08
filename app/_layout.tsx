import { Stack } from 'expo-router';
import { CartProvider } from '@/context/CartContext';

export default function RootLayout() {
  return (
    <CartProvider>
      <Stack>
        {/* La pantalla de índice ahora está oculta y se manejará con la redirección */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: '' }} />
        <Stack.Screen name="register" options={{ title: 'Se Parte de nuestra familia' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ title: 'Detalles' }} />
      </Stack>
    </CartProvider>
  );
}