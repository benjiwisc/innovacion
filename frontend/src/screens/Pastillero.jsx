import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, RefreshControl
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../lib/axios";
import { COLORES, FUENTES } from "../constants/theme";
import { useRoleConfig } from "../hooks/useRoleConfig";

const COLORES_ESTADO = {
  TOMADA:       { fondo: '#dcfce7', texto: '#16a34a', emoji: '✅' },
  OLVIDADA:     { fondo: '#fee2e2', texto: '#dc2626', emoji: '❌' },
  TOMADA_TARDE: { fondo: '#fef9c3', texto: '#ca8a04', emoji: '⚠️' },
};

function BadgeEstado({ estado, fontScale }) {
  const config = COLORES_ESTADO[estado] ?? { fondo: '#f3f4f6', texto: '#6b7280', emoji: '❓' };
  const styles = getStyles(fontScale);
  return (
    <View style={[styles.badge, { backgroundColor: config.fondo }]}>
      <Text style={[styles.badgeTexto, { color: config.texto }]}>
        {config.emoji} {estado ? estado.replace('_', ' ') : 'Desconocido'}
      </Text>
    </View>
  );
}

function formatFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function Pastillero() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const config = useRoleConfig();
  const styles = getStyles(config.fontScale);

  const cargarDatos = useCallback(async (esRefresh = false) => {
    if (esRefresh) setRefreshing(true);
    else setCargando(true);
    setError(null);

    try {
      const { data } = await axiosClient.get('/pastillero');
      setRegistros(data);
    } catch (err) {
      setError('No se pudieron cargar los datos del pastillero.');
      console.log('error pastillero:', err?.response?.status, err?.message);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const resumen = registros.reduce((acc, r) => {
    acc[r.estado] = (acc[r.estado] || 0) + 1;
    return acc;
  }, {});

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={COLORES.primario} />
        <Text style={styles.cargandoTexto}>Cargando datos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.errorTexto}>{error}</Text>
        <TouchableOpacity style={styles.botonReintentar} onPress={() => cargarDatos()}>
          <Text style={styles.botonReintentarTexto}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>

      <View style={styles.resumenContenedor}>
        <Text style={styles.seccion}>Resumen</Text>
        <View style={styles.resumenFila}>
          {Object.entries(COLORES_ESTADO).map(([key, cfg]) => (
            <View key={key} style={[styles.resumenTarjeta, { backgroundColor: cfg.fondo }]}>
              <Text style={styles.resumenEmoji}>{cfg.emoji}</Text>
              <Text style={[styles.resumenNumero, { color: cfg.texto }]}>
                {resumen[key] || 0}
              </Text>
              <Text style={[styles.resumenLabel, { color: cfg.texto }]}>
                {key.replace('_', ' ')}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.seccion}>Últimos registros</Text>
      <FlatList
        data={registros}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => cargarDatos(true)}
            colors={[COLORES.primario]}
          />
        }
        ListEmptyComponent={
          <View style={styles.centrado}>
            <Text style={styles.cargandoTexto}>Sin registros aún</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <View style={styles.tarjetaHeader}>
              <View style={styles.medInfoContainer}>
                <Text style={styles.medicamentoNombre}>
                  {item.medicamento ? `💊 ${item.medicamento.nombre_medicamento}` : '💊 Medicamento no especificado'}
                </Text>
                {item.medicamento && (
                  <Text style={styles.medicamentoDosis}>Dosis: {item.medicamento.dosis}</Text>
                )}
              </View>
              <BadgeEstado estado={item.estado} fontScale={config.fontScale} />
            </View>
            
            <View style={styles.divisor} />

            <View style={styles.tarjetaFooter}>
              <View>
                <Text style={styles.dispositivo}>
                  {item.dispositivo_id === 'APP-MANUAL' ? '📱 Registro Manual' : `📡 ${item.dispositivo_id}`}
                </Text>
                <Text style={styles.fecha}>{formatFecha(item.created_at)}</Text>
              </View>
              
              {!!item.confirmar_presencial && (
                <View style={styles.badgePresencial}>
                  <Text style={styles.badgePresencialTexto}>🤝 Verificado Presencial</Text>
                </View>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const getStyles = (fontScale) => StyleSheet.create({
  contenedor:        { flex: 1, backgroundColor: '#F8FAFC' },
  centrado:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  cargandoTexto:     { marginTop: 12, color: '#64748B', fontSize: 16 * fontScale, fontWeight: '500' },
  errorTexto:        { color: '#EF4444', textAlign: 'center', marginBottom: 16, fontSize: 16 * fontScale, fontWeight: '600' },
  
  seccion:           { 
    fontSize: 18 * fontScale, 
    fontWeight: '800', 
    color: '#1E293B', 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    letterSpacing: 0.3
  },
  
  resumenContenedor: { 
    backgroundColor: COLORES.blanco, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    paddingTop: 8,
    paddingBottom: 4,
    marginBottom: 8
  },
  resumenFila:       { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  resumenTarjeta:    { 
    flex: 1, 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center', 
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  resumenEmoji:      { fontSize: 26 * fontScale },
  resumenNumero:     { fontSize: 28 * fontScale, fontWeight: '900' },
  resumenLabel:      { fontSize: 11 * fontScale, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  tarjeta:           { 
    backgroundColor: COLORES.blanco, 
    marginHorizontal: 20, 
    marginBottom: 16, 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  tarjetaHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  medInfoContainer:  { flex: 1 },
  medicamentoNombre: { fontSize: 18 * fontScale, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  medicamentoDosis:  { fontSize: 14 * fontScale, color: '#64748B', fontWeight: '500' },
  
  divisor:           { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  
  tarjetaFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  dispositivo:       { fontSize: 13 * fontScale, fontWeight: '700', color: '#64748B', marginBottom: 2 },
  fecha:             { fontSize: 12 * fontScale, color: '#94A3B8', fontWeight: '500' },
  
  badgePresencial:   { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  badgePresencialTexto:{ color: '#16A34A', fontSize: 11 * fontScale, fontWeight: '800', letterSpacing: 0.3 },

  badge:             { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  badgeTexto:        { fontSize: 12 * fontScale, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  botonReintentar:   { 
    backgroundColor: COLORES.primario, 
    borderRadius: 12, 
    paddingHorizontal: 24, 
    paddingVertical: 14,
    shadowColor: COLORES.primario,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  botonReintentarTexto: { color: COLORES.blanco, fontWeight: '800', fontSize: 15 * fontScale, letterSpacing: 0.5 },
});