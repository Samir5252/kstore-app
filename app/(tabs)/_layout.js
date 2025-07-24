import React from 'react';
import { Tabs } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';

// --- Iconos Personalizados para la Barra de Pestañas ---

const HomeIcon = ({ color }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></Path>
        <Path d="M9 22V12h6v10"></Path>
    </Svg>
);

const AccountIcon = ({ color }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></Path>
        <Circle cx="12" cy="7" r="4"></Circle>
    </Svg>
);

const CartIcon = ({ color }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="9" cy="21" r="1"></Circle>
        <Circle cx="20" cy="21" r="1"></Circle>
        <Path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></Path>
    </Svg>
);

const MenuIcon = ({ color }) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 12h18"></Path>
        <Path d="M3 6h18"></Path>
        <Path d="M3 18h18"></Path>
    </Svg>
);


export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000000', // Color para el ícono activo (negro)
        tabBarInactiveTintColor: '#999999', // Color para los íconos inactivos (gris)
      }}>
      <Tabs.Screen
        name="index" // Corresponde a app/(tabs)/index.js
        options={{
          title: 'Inicio',
          headerShown: false, // Ocultamos el header para esta pantalla
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="cuenta" // Corresponde a app/(tabs)/cuenta.js
        options={{
          title: 'Cuenta',
          headerShown: false, // Ocultamos el header para esta pantalla
          tabBarIcon: ({ color }) => <AccountIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="carrito" // Corresponde a app/(tabs)/carrito.js
        options={{
          title: 'Carrito',
          headerShown: false, // Ocultamos el header para esta pantalla
          tabBarIcon: ({ color }) => <CartIcon color={color} />,
        }}
      />
       <Tabs.Screen
        name="menu" // Corresponde a app/(tabs)/menu.js
        options={{
          title: 'Menú',
          headerShown: false, // Ocultamos el header para esta pantalla
          tabBarIcon: ({ color }) => <MenuIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
