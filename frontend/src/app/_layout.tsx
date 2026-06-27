import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Foro } from '../screens/Foro';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Login } from '../screens/Login';
import { Register } from '../screens/Register';
import HomeScreen from './index';
import { Pastillero } from '../screens/Pastillero';
import { CodigoVinculacion } from '../screens/CodigoVinculacion';

function Navegacion() {
  const { usuario, loading, logout } = useAuth() as {
      usuario: { id: number; name: string; email: string; rol: string; codigo_vinculacion: string | null } | null;
      loading: boolean;
      logout: () => Promise<void>;
  };
  const [pantalla, setPantalla] = useState<'login' | 'register'>('login');
  const [tab, setTab] = useState<'home' | 'pastillero' | 'codigo'| 'foro'>('home');

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!usuario) {
    if (pantalla === 'register') {
      return <Register onVolverLogin={() => setPantalla('login')} />;
    }
    return <Login onIrRegistro={() => setPantalla('register')} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <AnimatedSplashOverlay />

      {/* Barra superior */}
      <View style={styles.topBar}>
        <Text style={styles.appNombre}>MediApp</Text>
        <TouchableOpacity style={styles.botonSalir} onPress={logout}>
          <Text style={styles.botonSalirTexto}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      <View style={{ flex: 1 }}>
        {tab === 'home'       && <HomeScreen />}
        {tab === 'pastillero' && <Pastillero />}
        {tab === 'codigo'     && <CodigoVinculacion usuario={usuario} />}
        {tab === 'foro' && <Foro />}
      </View>

      {/* Barra inferior */}
      <View style={styles.barra}>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'home' && styles.tabActivo]}
          onPress={() => setTab('home')}
        >
          <Text style={[styles.tabTexto, tab === 'home' && styles.tabTextoActivo]}>🏠 Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, tab === 'pastillero' && styles.tabActivo]}
          onPress={() => setTab('pastillero')}
        >
          <Text style={[styles.tabTexto, tab === 'pastillero' && styles.tabTextoActivo]}>💊 Pastillero</Text>
        </TouchableOpacity>
        {usuario.rol === 'adulto_mayor' && (
          <TouchableOpacity
            style={[styles.tabItem, tab === 'codigo' && styles.tabActivo]}
            onPress={() => setTab('codigo')}
          >
            <Text style={[styles.tabTexto, tab === 'codigo' && styles.tabTextoActivo]}>
              🔑 Mi código
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.tabItem, tab === 'foro' && styles.tabActivo]}
          onPress={() => setTab('foro')}
        >
          <Text style={[styles.tabTexto, tab === 'foro' && styles.tabTextoActivo]}>
            💬 Foro
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Navegacion />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  appNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  botonSalir: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botonSalirTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  barra: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActivo: {
    borderTopWidth: 2,
    borderTopColor: '#16a34a',
  },
  tabTexto: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabTextoActivo: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
});