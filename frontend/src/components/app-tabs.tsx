import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { COLORES, FUENTES } from '../constants/theme';
import HomeScreen from '../app/index';
import { Pastillero } from '../screens/Pastillero';

export default function AppTabs() {
  const [tab, setTab] = useState<'home' | 'pastillero'>('home');
  const { logout } = useAuth() as { logout: () => Promise<void> };

  return (
    <View style={styles.contenedor}>

      {/* Contenido */}
      <View style={styles.cuerpo}>
        {tab === 'home'       && <HomeScreen />}
        {tab === 'pastillero' && <Pastillero />}
      </View>

      {/* Barra inferior */}
      <View style={styles.barra}>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'home' && styles.tabActivo]}
          onPress={() => setTab('home')}
        >
          <Text style={[styles.tabTexto, tab === 'home' && styles.tabTextoActivo]}>
            🏠 Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, tab === 'pastillero' && styles.tabActivo]}
          onPress={() => setTab('pastillero')}
        >
          <Text style={[styles.tabTexto, tab === 'pastillero' && styles.tabTextoActivo]}>
            💊 Pastillero
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={logout}>
          <Text style={[styles.tabTexto, { color: COLORES.rojo }]}>🚪 Salir</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  cuerpo: {
    flex: 1,
  },
  barra: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORES.borde,
    backgroundColor: COLORES.blanco,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActivo: {
    borderTopWidth: 2,
    borderTopColor: COLORES.primario,
  },
  tabTexto: {
    fontSize: FUENTES.medio,
    color: COLORES.textoGris,
  },
  tabTextoActivo: {
    color: COLORES.primario,
    fontWeight: 'bold',
  },
});