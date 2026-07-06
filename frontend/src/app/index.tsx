import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, TouchableOpacity, Alert } from "react-native";
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

interface PastilleroEstado {
  id: number;
  medicamento_id: number | null;
  estado: 'TOMADA' | 'OLVIDADA' | 'TOMADA_TARDE';
  confirmar_presencial: number | boolean;
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function HomeScreen() {
  const { usuario } = useAuth() as { usuario: Usuario | null };
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [estadosPastillero, setEstadosPastillero] = useState<PastilleroEstado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const config = useRoleConfig();
  const styles = getStyles(config.fontScale);

  const diaHoy = DIAS_SEMANA[new Date().getDay()];

  const cargarDatosHoy = useCallback(async (esRefresh = false) => {
    if (esRefresh) setRefreshing(true);
    else setCargando(true);
    try {
      // 1. Obtener medicamentos programados
      const resMedicamentos = await axiosClient.get('/medicamentos');
      const filtrados = resMedicamentos.data.filter((m: Medicamento) => m.dia_semana === diaHoy);
      setMedicamentos(filtrados);

      // 2. Obtener los estados del pastillero vinculados
      const resEstados = await axiosClient.get('/pastillero');
      setEstadosPastillero(resEstados.data);
    } catch (e) {
      console.log('error home datos:', e);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, [diaHoy]);

  useEffect(() => {
    cargarDatosHoy();
  }, [cargarDatosHoy]);

  const confirmarTomaPresencial = async (medicamentoId: number) => {
    try {
      await axiosClient.post(`/pastillero/confirmar`, {
        medicamento_id: medicamentoId
      });
      
      Alert.alert("Éxito", "Toma presencial registrada correctamente.");
      cargarDatosHoy(true);
    } catch (error) {
      console.log("Error al confirmar toma presencial:", error);
      Alert.alert("Error", "No se pudo registrar la confirmación presencial.");
    }
  };

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
            onRefresh={() => cargarDatosHoy(true)}
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
          medicamentos.map((item) => {
            // Se asocian los estados por ID mitigando diferencias de tipado primitivo (string/number)
            const estadoRegistro = estadosPastillero.find(e => e.medicamento_id == item.id);
            const estadoActual = estadoRegistro?.estado || 'PENDIENTE';
            const esPresencial = Boolean(estadoRegistro?.confirmar_presencial);

            return (
              <View key={item.id} style={styles.tarjetaMed}>
                <View style={styles.filaPrincipal}>
                  <View style={styles.badgeHora}>
                    <Text style={styles.badgeHoraTexto}>🕒 {formatHora(item.hora)}</Text>
                  </View>
                  <View style={styles.medInfo}>
                    <Text style={styles.medNombre}>{item.nombre_medicamento}</Text>
                    <Text style={styles.medDosis}>Dosis: {item.dosis}</Text>
                  </View>
                  
                  {/* Badge de Estado Dinámico de la Base de Datos */}
                  <View style={[
                    styles.badgeEstado, 
                    (estadoActual === 'TOMADA' || estadoActual === 'TOMADA_TARDE') ? styles.badgeTomado : 
                    estadoActual === 'OLVIDADA' ? styles.badgeNoTomado : styles.badgePendiente
                  ]}>
                    <Text style={[
                      styles.badgeEstadoTexto,
                      (estadoActual === 'TOMADA' || estadoActual === 'TOMADA_TARDE') ? styles.textoTomado : 
                      estadoActual === 'OLVIDADA' ? styles.textoNoTomado : styles.textoPendiente
                    ]}>
                      {estadoActual === 'TOMADA' ? 'Tomada' : 
                       estadoActual === 'TOMADA_TARDE' ? 'Tarde' : 
                       estadoActual === 'OLVIDADA' ? 'Olvidada' : 'Pendiente'}
                    </Text>
                  </View>
                </View>

                {/* Separador */}
                <View style={styles.divisor} />

                {/* Botón de Acción Presencial */}
                <TouchableOpacity
                  style={[styles.btnPresencial, esPresencial && styles.btnPresencialConfirmado]}
                  disabled={esPresencial}
                  onPress={() => confirmarTomaPresencial(item.id)}
                >
                  <Text style={[styles.btnPresencialTexto, esPresencial && styles.btnPresencialTextoConfirmado]}>
                    {esPresencial ? "✅ Presencial Confirmado" : "🤝 Confirmar Toma Presencial"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
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
  cuerpo: { 
    padding: 24 
  },
  seccion: { 
    fontSize: FUENTES.medio * fontScale, 
    fontWeight: "bold", 
    color: COLORES.primario, 
    marginBottom: 16 
  },

  // Tarjetas de Medicamentos
  tarjetaMed: {
    backgroundColor: COLORES.blanco,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORES.borde,
    marginBottom: 12,
  },
  filaPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeHora: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 12,
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

  // Estilos de los estados (Mayúsculas)
  badgeEstado: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeEstadoTexto: {
    fontSize: 12 * fontScale,
    fontWeight: 'bold',
  },
  badgeTomado: { backgroundColor: '#e8f5e9' },
  textoTomado: { color: '#2e7d32' },
  badgeNoTomado: { backgroundColor: '#ffebee' },
  textoNoTomado: { color: '#c62828' },
  badgePendiente: { backgroundColor: '#f5f5f5' },
  textoPendiente: { color: '#616161' },

  // Separador Interno
  divisor: {
    height: 1,
    backgroundColor: COLORES.borde,
    marginVertical: 12,
  },

  // Botón Confirmar Presencial
  btnPresencial: {
    backgroundColor: COLORES.primario,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPresencialConfirmado: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#a5d6a7',
  },
  btnPresencialTexto: {
    color: COLORES.blanco,
    fontWeight: 'bold',
    fontSize: 13 * fontScale,
  },
  btnPresencialTextoConfirmado: {
    color: '#2e7d32',
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