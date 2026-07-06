import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  Alert, Modal, ScrollView, Platform
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import DateTimePicker from '@react-native-community/datetimepicker';
import axiosClient from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { COLORES, FUENTES } from "../constants/theme";

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function Medicamentos() {
  const { usuario } = useAuth();

  // Estados
  const [horarios, setHorarios]     = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Estados de formulario
  const [nombre, setNombre]         = useState('');
  const [dosis, setDosis]           = useState('');
  const [diaSemana, setDiaSemana]   = useState('Lunes');
  const [hora, setHora]             = useState('08:00');
  const [guardando, setGuardando]   = useState(false);

  // DateTimePicker para móvil
  const [mostrarTimePicker, setMostrarTimePicker] = useState(false);
  const [horaSeleccionada, setHoraSeleccionada]   = useState(new Date());

  // Cargar datos
  const cargarHorarios = useCallback(async (esRefresh = false) => {
    if (esRefresh) setRefreshing(true);
    else setCargando(true);
    try {
      const { data } = await axiosClient.get('/medicamentos');
      setHorarios(data);
    } catch (e) {
      console.log('error cargar horarios:', e?.response?.status, e?.message);
      Alert.alert('Error', 'No se pudieron cargar los horarios de medicamentos.');
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarHorarios();
  }, []);

  // Agregar Horario
  const handleGuardar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Escribe el nombre del medicamento');
      return;
    }
    if (!dosis.trim()) {
      Alert.alert('Error', 'Especifica la dosis (ej: 1 tableta)');
      return;
    }

    setGuardando(true);
    try {
      const { data } = await axiosClient.post('/medicamentos', {
        nombre_medicamento: nombre.trim(),
        dosis: dosis.trim(),
        dia_semana: diaSemana,
        hora: hora,
      });

      // Recargar lista y cerrar modal
      setHorarios(prev => [...prev, data].sort((a, b) => {
        const order = DIAS_SEMANA.indexOf(a.dia_semana) - DIAS_SEMANA.indexOf(b.dia_semana);
        if (order !== 0) return order;
        return a.hora.localeCompare(b.hora);
      }));
      setModalVisible(false);

      // Limpiar formulario
      setNombre('');
      setDosis('');
      setDiaSemana('Lunes');
      setHora('08:00');
    } catch (e) {
      console.log('error guardar horario:', e?.response?.status, e?.response?.data);
      Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo guardar el horario.');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar Horario
  const handleEliminar = (id) => {
    Alert.alert('Eliminar Horario', '¿Estás seguro de que quieres eliminar esta programación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await axiosClient.delete(`/medicamentos/${id}`);
            setHorarios(prev => prev.filter(h => h.id !== id));
          } catch (e) {
            Alert.alert('Error', 'No se pudo eliminar el horario.');
          }
        }
      }
    ]);
  };

  // Formatear Hora para mostrar (ej: "08:00:00" -> "08:00")
  const formatHora = (horaStr) => {
    if (!horaStr) return '';
    return horaStr.substring(0, 5);
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={COLORES.primario} />
        <Text style={styles.cargandoTexto}>Cargando horarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      {/* Botón para agregar */}
      <TouchableOpacity style={styles.botonNuevo} onPress={() => setModalVisible(true)}>
        <Text style={styles.botonNuevoTexto}>➕ Agregar Medicamento</Text>
      </TouchableOpacity>

      {/* Lista de medicamentos */}
      <FlatList
        data={horarios}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => cargarHorarios(true)}
            colors={[COLORES.primario]}
          />
        }
        ListEmptyComponent={
          <View style={styles.centradoVacio}>
            <Text style={styles.vacioEmoji}>⏰</Text>
            <Text style={styles.vacioTexto}>No hay medicamentos programados aún.</Text>
            <Text style={styles.vacioSubtexto}>Usa el botón de arriba para programar un horario.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <View style={styles.tarjetaHeader}>
              <View style={styles.badgeDia}>
                <Text style={styles.badgeDiaTexto}>📅 {item.dia_semana}</Text>
              </View>
              <View style={styles.badgeHora}>
                <Text style={styles.badgeHoraTexto}>🕒 {formatHora(item.hora)}</Text>
              </View>
            </View>

            <View style={styles.tarjetaCuerpo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nombreMed}>{item.nombre_medicamento}</Text>
                <Text style={styles.dosisMed}>Dosis: {item.dosis}</Text>
              </View>

              <TouchableOpacity style={styles.botonEliminar} onPress={() => handleEliminar(item.id)}>
                <Text style={styles.eliminarIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal nuevo horario */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContenido}>
          <Text style={styles.modalTitulo}>Programar Medicamento</Text>

          {/* Nombre medicamento */}
          <Text style={styles.label}>Nombre del Medicamento</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Paracetamol"
            value={nombre}
            onChangeText={setNombre}
          />

          {/* Dosis */}
          <Text style={styles.label}>Dosis</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 1 tableta / 10 ml"
            value={dosis}
            onChangeText={setDosis}
          />

          {/* Día de la semana */}
          <Text style={styles.label}>Día de la Semana</Text>
          <View style={styles.diasContenedor}>
            {DIAS_SEMANA.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.diaBoton, diaSemana === d && styles.diaBotonActivo]}
                onPress={() => setDiaSemana(d)}
              >
                <Text style={[styles.diaTexto, diaSemana === d && styles.diaTextoActivo]}>
                  {d.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hora */}
          <Text style={styles.label}>Hora de Toma</Text>
          {Platform.OS === 'web' ? (
            <input
              type="time"
              style={{
                width: '100%', padding: 14, fontSize: 16,
                borderRadius: 10, border: '1px solid #D9D9D9',
                marginBottom: 20, backgroundColor: '#fff',
                boxSizing: 'border-box',
              }}
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          ) : (
            <>
              <TouchableOpacity style={styles.selectorHora} onPress={() => setMostrarTimePicker(true)}>
                <Text style={styles.selectorHoraTexto}>🕒 {hora}</Text>
              </TouchableOpacity>
              {mostrarTimePicker && (
                <DateTimePicker
                  value={horaSeleccionada}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(event, date) => {
                    setMostrarTimePicker(false);
                    if (date) {
                      setHoraSeleccionada(date);
                      const hh = String(date.getHours()).padStart(2, '0');
                      const mm = String(date.getMinutes()).padStart(2, '0');
                      setHora(`${hh}:${mm}`);
                    }
                  }}
                />
              )}
            </>
          )}

          {/* Botones de acción */}
          <TouchableOpacity
            style={[styles.botonGuardar, guardando && { opacity: 0.7 }]}
            onPress={handleGuardar}
            disabled={guardando}
          >
            {guardando
              ? <ActivityIndicator color={COLORES.blanco} />
              : <Text style={styles.botonGuardarTexto}>Programar Horario</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonCancelar} onPress={() => setModalVisible(false)}>
            <Text style={styles.botonCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  centradoVacio: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 40 },
  cargandoTexto: { marginTop: 12, color: COLORES.textoGris, fontSize: FUENTES.medio },
  
  botonNuevo: { margin: 16, backgroundColor: COLORES.primario, borderRadius: 12, padding: 14, alignItems: 'center' },
  botonNuevoTexto: { color: COLORES.blanco, fontWeight: 'bold', fontSize: FUENTES.medio },

  // Lista / Tarjetas
  vacioEmoji: { fontSize: 48, marginBottom: 12 },
  vacioTexto: { fontSize: 16, fontWeight: 'bold', color: COLORES.primario, textAlign: 'center', marginBottom: 4 },
  vacioSubtexto: { fontSize: 13, color: COLORES.textoGris, textAlign: 'center' },

  tarjeta: {
    backgroundColor: COLORES.blanco,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  tarjetaHeader: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badgeDia: { backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeDiaTexto: { color: '#2e7d32', fontSize: 11, fontWeight: 'bold' },
  badgeHora: { backgroundColor: '#e3f2fd', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeHoraTexto: { color: '#1565c0', fontSize: 11, fontWeight: 'bold' },

  tarjetaCuerpo: { flexDirection: 'row', alignItems: 'center' },
  nombreMed: { fontSize: FUENTES.medio, fontWeight: 'bold', color: '#1b5e20', marginBottom: 4 },
  dosisMed: { fontSize: 13, color: COLORES.textoGris },
  botonEliminar: { padding: 8, marginLeft: 16 },
  eliminarIcon: { fontSize: 18 },

  // Modal
  modalContenido: { padding: 24, paddingTop: 60 },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', color: COLORES.primario, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORES.primario, marginBottom: 8 },
  input: {
    backgroundColor: COLORES.blanco,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 10,
    padding: 14,
    fontSize: FUENTES.medio,
    marginBottom: 16
  },
  diasContenedor: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  diaBoton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 8,
    backgroundColor: COLORES.blanco,
    minWidth: 46,
    alignItems: 'center'
  },
  diaBotonActivo: { borderColor: COLORES.primario, backgroundColor: '#e8f5e9' },
  diaTexto: { fontSize: 11, color: COLORES.textoGris },
  diaTextoActivo: { color: '#2e7d32', fontWeight: 'bold' },

  selectorHora: {
    backgroundColor: COLORES.blanco,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  selectorHoraTexto: { fontSize: FUENTES.medio, fontWeight: 'bold', color: COLORES.primario },

  botonGuardar: { backgroundColor: COLORES.primario, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  botonGuardarTexto: { color: COLORES.blanco, fontWeight: 'bold', fontSize: FUENTES.medio },
  botonCancelar: { padding: 14, alignItems: 'center' },
  botonCancelarTexto: { color: COLORES.textoGris, fontSize: FUENTES.medio },
});
