import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { COLORES, FUENTES } from "../constants/theme";
import { useState, useEffect, useCallback } from "react";
import axiosClient from "../lib/axios";
import { useRoleConfig } from '../hooks/useRoleConfig';

interface Usuario {
  id: number;
  name: string;
  email: string;
  rol: 'adulto_mayor' | 'cuidador' | 'familia';
}

interface Medicamento {
  id: number;
  nombre_medicamento: string;
  dosis: string;
  dia_semana: string;
  hora: string;
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function HomeScreen() {
  const { usuario } = useAuth() as { usuario: Usuario | null };
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const config = useRoleConfig();
  const styles = getStyles(config.fontScale);

  const diaHoy = DIAS_SEMANA[new Date().getDay()];

  const cargarMedicamentosHoy = useCallback(async (esRefresh = false) => {
    if (esRefresh) setRefreshing(true);
    else setCargando(true);
    try {
      const { data } = await axiosClient.get('/medicamentos');
      // Filtrar solo los medicamentos de hoy
      const filtrados = data.filter((m: Medicamento) => m.dia_semana === diaHoy);
      setMedicamentos(filtrados);
    } catch (e) {
      console.log('error home medicamentos:', e);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, [diaHoy]);

  useEffect(() => {
    cargarMedicamentosHoy();
  }, [cargarMedicamentosHoy]);

  const formatHora = (horaStr: string) => {
    if (!horaStr) return '';
    return horaStr.substring(0, 5);
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.header}>
        <Text style={styles.saludo}>Bienvenido 👋</Text>
        <Text style={styles.nombre}>{usuario?.name}</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.cuerpo}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => cargarMedicamentosHoy(true)}
            colors={[COLORES.primario]}
          />
        }
      >
        <Text style={styles.seccion}>📅 Medicamentos para hoy ({diaHoy})</Text>

        {cargando ? (
          <ActivityIndicator size="small" color={COLORES.primario} style={{ marginTop: 24 }} />
        ) : medicamentos.length === 0 ? (
          <View style={styles.tarjetaVacia}>
            <Text style={styles.vacioEmoji}>☀️</Text>
            <Text style={styles.vacioTexto}>No tienes medicamentos programados para hoy.</Text>
            <Text style={styles.vacioSubtexto}>¡Disfruta tu día libre de dosis!</Text>
          </View>
        ) : (
          medicamentos.map((item) => (
            <View key={item.id} style={styles.tarjetaMed}>
              <View style={styles.badgeHora}>
                <Text style={styles.badgeHoraTexto}>🕒 {formatHora(item.hora)}</Text>
              </View>
              <View style={styles.medInfo}>
                <Text style={styles.medNombre}>{item.nombre_medicamento}</Text>
                <Text style={styles.medDosis}>Dosis: {item.dosis}</Text>
              </View>
            </View>
          ))
        )}

        <Text style={[styles.seccion, { marginTop: 24 }]}>Panel informativo</Text>
        
        <View style={styles.tarjetaInfo}>
          <Text style={styles.infoTitulo}>🩺 Consejo de salud</Text>
          <Text style={styles.infoTexto}>
            Recuerda tomar tus medicamentos siempre a la hora programada y acompañarlos con agua.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (fontScale: number) => StyleSheet.create({
  contenedor: { 
    flex: 1, 
    backgroundColor: COLORES.fondo 
  },
  header: {
    padding: 24,
    backgroundColor: COLORES.blanco,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },
  saludo: { 
    fontSize: FUENTES.medio * fontScale, 
    color: COLORES.textoGris 
  },
  nombre: { 
    fontSize: 20 * fontScale, 
    fontWeight: "bold", 
    color: COLORES.primario 
  },
  email: { 
    fontSize: 12 * fontScale, 
    color: COLORES.textoGris, 
    marginTop: 2 
  },
  cuerpo: { 
    padding: 24 
  },
  seccion: { 
    fontSize: FUENTES.medio * fontScale, 
    fontWeight: "bold", 
    color: COLORES.primario, 
    marginBottom: 16 
  },

  // Medicamentos hoy
  tarjetaMed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.blanco,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORES.borde,
    marginBottom: 12,
  },
  badgeHora: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 16,
  },
  badgeHoraTexto: {
    color: '#1565c0',
    fontWeight: 'bold',
    fontSize: 13 * fontScale,
  },
  medInfo: { 
    flex: 1 
  },
  medNombre: { 
    fontSize: 16 * fontScale, 
    fontWeight: 'bold', 
    color: '#1b5e20' 
  },
  medDosis: { 
    fontSize: 13 * fontScale, 
    color: COLORES.textoGris, 
    marginTop: 2 
  },

  // Tarjeta vacía
  tarjetaVacia: {
    backgroundColor: COLORES.blanco,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORES.borde,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  vacioEmoji: { 
    fontSize: 36 * fontScale, 
    marginBottom: 8 
  },
  vacioTexto: { 
    fontSize: 14 * fontScale, 
    fontWeight: 'bold', 
    color: COLORES.primario, 
    textAlign: 'center', 
    marginBottom: 4 
  },
  vacioSubtexto: { 
    fontSize: 12 * fontScale, 
    color: COLORES.textoGris, 
    textAlign: 'center' 
  },

  // Tarjeta info
  tarjetaInfo: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fcd34d',
    marginBottom: 12,
  },
  infoTitulo: { 
    fontSize: 14 * fontScale, 
    fontWeight: 'bold', 
    color: '#92400e', 
    marginBottom: 4 
  },
  infoTexto: { 
    fontSize: 13 * fontScale, 
    color: '#78350f', 
    lineHeight: 20 * fontScale 
  },
});