import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Login } from '../screens/Login';                       

function Navegacion() {
  const { usuario } = useAuth();
  if (!usuario) return <Login />;
  return (
    <>
      <AnimatedSplashOverlay />
      <AppTabs />
    </>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>  {/*envuelve todo */}
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Navegacion />
      </ThemeProvider>
    </AuthProvider>
  );
}