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
            <View style={styles.tarjetaFila}>
              <View>
                <Text style={styles.dispositivo}>📡 {item.dispositivo_id}</Text>
                <Text style={styles.fecha}>{formatFecha(item.created_at)}</Text>
              </View>
              <BadgeEstado estado={item.estado} fontScale={config.fontScale} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const getStyles = (fontScale) => StyleSheet.create({
  contenedor:        { flex: 1, backgroundColor: COLORES.fondo },
  centrado:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  cargandoTexto:     { marginTop: 12, color: COLORES.textoGris, fontSize: FUENTES.medio * fontScale },
  errorTexto:        { color: COLORES.rojo, textAlign: 'center', marginBottom: 16, fontSize: FUENTES.medio * fontScale },
  seccion:           { fontSize: FUENTES.medio * fontScale, fontWeight: 'bold', color: COLORES.primario, paddingHorizontal: 16, paddingVertical: 12 },
  resumenContenedor: { backgroundColor: COLORES.blanco, borderBottomWidth: 1, borderBottomColor: COLORES.borde },
  resumenFila:       { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  resumenTarjeta:    { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  resumenEmoji:      { fontSize: 22 * fontScale },
  resumenNumero:     { fontSize: 24 * fontScale, fontWeight: 'bold' },
  resumenLabel:      { fontSize: 10 * fontScale, fontWeight: '600', textAlign: 'center' },
  tarjeta:           { backgroundColor: COLORES.blanco, marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORES.borde },
  tarjetaFila:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dispositivo:       { fontSize: FUENTES.medio * fontScale, fontWeight: 'bold', color: COLORES.primario },
  fecha:             { fontSize: 12 * fontScale, color: COLORES.textoGris, marginTop: 4 },
  badge:             { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  badgeTexto:        { fontSize: 12 * fontScale, fontWeight: 'bold' },
  botonReintentar:   { backgroundColor: COLORES.primario, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  botonReintentarTexto: { color: COLORES.blanco, fontWeight: 'bold', fontSize: FUENTES.medio * fontScale },
});