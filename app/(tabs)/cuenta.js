// Ejemplo para app/(tabs)/cuenta.js (usa un texto diferente para cada archivo)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CuentaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla de Cuenta</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
});
