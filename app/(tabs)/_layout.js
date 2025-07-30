import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useCart } from '@/context/CartContext'; // 1. Importa el hook del carrito
import Svg, { Path, Circle } from 'react-native-svg';

// --- Iconos (código existente) ---
const HomeIcon = ({ color }) => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></Path><Path d="M9 22V12h6v10"></Path></Svg>;
const AccountIcon = ({ color }) => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></Path><Circle cx="12" cy="7" r="4"></Circle></Svg>;
const MenuIcon = ({ color }) => <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M3 12h18"></Path><Path d="M3 6h18"></Path><Path d="M3 18h18"></Path></Svg>;

// --- Componente del Icono del Carrito con Notificación ---
const CartIconWithBadge = ({ color }) => {
    const { itemCount } = useCart(); // 2. Obtiene el número de ítems del contexto
    return (
        <View>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="9" cy="21" r="1"></Circle><Circle cx="20" cy="21" r="1"></Circle>
                <Path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></Path>
            </Svg>
            {itemCount > 0 && (
                <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{itemCount}</Text>
                </View>
            )}
        </View>
    );
};

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#000000', tabBarInactiveTintColor: '#999999', headerShown: false, }}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color }) => <HomeIcon color={color} /> }} />
      <Tabs.Screen name="cuenta" options={{ title: 'Cuenta', tabBarIcon: ({ color }) => <AccountIcon color={color} /> }} />
      <Tabs.Screen
        name="carrito"
        options={{
          title: 'Carrito',
          // 3. Usa el nuevo componente como icono
          tabBarIcon: ({ color }) => <CartIconWithBadge color={color} />,
        }}
      />
       <Tabs.Screen name="menu" options={{ title: 'Menú', tabBarIcon: ({ color }) => <MenuIcon color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
    badgeContainer: {
        position: 'absolute',
        right: -6,
        top: -3,
        backgroundColor: 'red',
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
