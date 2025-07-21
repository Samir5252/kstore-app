import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    // Stack es el tipo de navegador más común.
    // Te permite "apilar" pantallas una encima de otra y volver atrás.
    <Stack>
      {/* Cada Stack.Screen es una pantalla en tu navegador */}
      <Stack.Screen name="index" options={{ title: 'Bienvenido' }} />
      {/* login */}
      <Stack.Screen name="login" options={{ title: 'Iniciar Sesión' }} />
    </Stack>
  );
}