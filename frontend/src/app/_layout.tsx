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
import { Medicamentos } from '../screens/Medicamentos';
import { useRoleConfig } from '../hooks/useRoleConfig';

type Usuario = {
  id: number;
  name: string;
  email: string;
  rol: 'adulto_mayor' | 'cuidador' | 'familia';
  codigo_vinculacion: string | null;
};

type Tab = 'home' | 'foro' | 'cuenta';
type SubPantallaCuenta = 'menu' | 'pastillero' | 'codigo' | 'medicamentos' | 'agregar_adulto';

const ETIQUETAS_ROL: Record<Usuario['rol'], string> = {
  adulto_mayor: 'Adulto Mayor',
  cuidador: 'Cuidador',
  familia: 'Familiar',
};

// Pantalla "Cuenta": datos del usuario + accesos a configuraciones
function PantallaCuenta({ usuario }: { usuario: Usuario }) {
  const [sub, setSub] = useState<SubPantallaCuenta>('menu');
  const config = useRoleConfig();
  const styles = getStylesCuenta(config.fontScale);
  const { logout } = useAuth() as { logout: () => Promise<void> };

  if (sub === 'pastillero') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.volver} onPress={() => setSub('menu')}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </TouchableOpacity>
        <Pastillero />
      </View>
    );
  }

  if (sub === 'codigo') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.volver} onPress={() => setSub('menu')}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </TouchableOpacity>
        <CodigoVinculacion usuario={usuario} />
      </View>
    );
  }

  if (sub === 'medicamentos') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.volver} onPress={() => setSub('menu')}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </TouchableOpacity>
        <Medicamentos />
      </View>
    );
  }

  if (sub === 'agregar_adulto') {
  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.volver} onPress={() => setSub('menu')}>
        <Text style={styles.volverTexto}>← Volver</Text>
      </TouchableOpacity>
      <CodigoVinculacion usuario={usuario} />
    </View>
  );
}

  // Menú principal de Cuenta
  return (
    <View style={styles.contenedor}>
      {/* Datos principales del usuario */}
      <View style={styles.tarjetaUsuario}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>
            {usuario.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.nombreUsuario}>{usuario.name}</Text>
        <Text style={styles.emailUsuario}>{usuario.email}</Text>
        <View style={styles.badgeRol}>
          <Text style={styles.badgeRolTexto}>{ETIQUETAS_ROL[usuario.rol]}</Text>
        </View>
      </View>

      {/* Opciones de configuración */}
      <TouchableOpacity style={styles.opcion} onPress={() => setSub('pastillero')}>
        <Text style={styles.opcionEmoji}>💊</Text>
        <Text style={styles.opcionTexto}>Pastillero</Text>
        <Text style={styles.opcionFlecha}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.opcion} onPress={() => setSub('codigo')}>
        <Text style={styles.opcionEmoji}>🔑</Text>
        <Text style={styles.opcionTexto}>Código de vinculación</Text>
        <Text style={styles.opcionFlecha}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.opcion} onPress={() => setSub('medicamentos')}>
        <Text style={styles.opcionEmoji}>⏰</Text>
        <Text style={styles.opcionTexto}>Horarios de medicamentos</Text>
        <Text style={styles.opcionFlecha}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.botonSalir} onPress={logout}>
        <Text style={styles.botonSalirTexto}>Cerrar sesión</Text>
      </TouchableOpacity>

      {/* Solo cuidador ve esta opción */}
      {usuario.rol === 'cuidador' && (
        <TouchableOpacity style={styles.opcionDestacada} onPress={() => setSub('agregar_adulto')}>
          <Text style={styles.opcionEmoji}>➕</Text>
          <Text style={styles.opcionDestacadaTexto}>Agregar más adultos mayores</Text>
          <Text style={styles.opcionFlecha}>›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Navegacion() {
  const { usuario, loading, logout } = useAuth() as {
    usuario: Usuario | null;
    loading: boolean;
    logout: () => Promise<void>;
  };
  const [pantalla, setPantalla] = useState<'login' | 'register'>('login');
  const [tab, setTab] = useState<Tab>('home');
  const config = useRoleConfig();
  const styles = getStyles(config.fontScale);

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
        <Text style={styles.appNombre}>Golden Care</Text>
      </View>

      {/* Contenido */}
      <View style={{ flex: 1 }}>
        {tab === 'home' && <HomeScreen />}
        {tab === 'foro' && <Foro />}
        {tab === 'cuenta' && <PantallaCuenta usuario={usuario} />}
      </View>

      {/* Barra inferior: fija, 3 tabs para todos los roles */}
      <View style={styles.barra}>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'home' && styles.tabActivo]}
          onPress={() => setTab('home')}
        >
          <Text style={[styles.tabTexto, tab === 'home' && styles.tabTextoActivo]}>🏠 Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, tab === 'foro' && styles.tabActivo]}
          onPress={() => setTab('foro')}
        >
          <Text style={[styles.tabTexto, tab === 'foro' && styles.tabTextoActivo]}>💬 Foro</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, tab === 'cuenta' && styles.tabActivo]}
          onPress={() => setTab('cuenta')}
        >
          <Text style={[styles.tabTexto, tab === 'cuenta' && styles.tabTextoActivo]}>👤 Cuenta</Text>
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

const getStyles = (fontScale: number) => StyleSheet.create({
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
    fontSize: 18 * fontScale,
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
    fontSize: 13 * fontScale,
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
    fontSize: 14 * fontScale,
    color: '#6b7280',
  },
  tabTextoActivo: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
});

const getStylesCuenta = (fontScale: number) => StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 20,
  },
  tarjetaUsuario: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  botonSalir: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  botonSalirTexto: {
    fontSize: 15 * fontScale,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  avatarTexto: {
    fontSize: 22 * fontScale,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  nombreUsuario: {
    fontSize: 18 * fontScale,
    fontWeight: 'bold',
    color: '#111827',
  },
  emailUsuario: {
    fontSize: 13 * fontScale,
    color: '#6b7280',
    marginTop: 2,
  },
  badgeRol: {
    marginTop: 10,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeRolTexto: {
    fontSize: 12 * fontScale,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  opcionEmoji: {
    fontSize: 20 * fontScale,
    marginRight: 12,
  },
  opcionTexto: {
    flex: 1,
    fontSize: 15 * fontScale,
    fontWeight: '600',
    color: '#111827',
  },
  opcionFlecha: {
    fontSize: 20 * fontScale,
    color: '#9ca3af',
  },
  opcionDestacada: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  opcionDestacadaTexto: {
    flex: 1,
    fontSize: 15 * fontScale,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  volver: {
    padding: 16,
  },
  volverTexto: {
    fontSize: 14 * fontScale,
    color: '#16a34a',
    fontWeight: 'bold',
  },
});