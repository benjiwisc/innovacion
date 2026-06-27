import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, Image, ActivityIndicator,
  RefreshControl, Alert, Modal, ScrollView, Platform
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from '@react-native-community/datetimepicker';
import axiosClient from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { COLORES, FUENTES } from "../constants/theme";

const API_BASE = 'http://192.168.1.3:8000';

//Utilidades
function formatFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatParaLaravel(fecha) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
}

//Componente tarjeta
function TarjetaPublicacion({ item, usuarioId, onLike, onComentar, onEliminar }) {
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [comentario, setComentario]                 = useState('');
  const [enviando, setEnviando]                     = useState(false);

  const handleComentar = async () => {
    if (!comentario.trim()) return;
    setEnviando(true);
    try {
      await onComentar(item.id, comentario.trim());
      setComentario('');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.tarjeta}>

      {/* Header */}
      <View style={styles.tarjetaHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{item.user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.autorNombre}>{item.user?.name}</Text>
          <Text style={styles.fecha}>{formatFecha(item.created_at)}</Text>
        </View>
        {item.user?.id === usuarioId && (
          <TouchableOpacity onPress={() => onEliminar(item.id)}>
            <Text style={styles.eliminar}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Badge cita */}
      {item.tipo === 'cita' && (
        <View style={styles.citaBadge}>
          <Text style={styles.citaBadgeTexto}>📅 CITA MÉDICA</Text>
          <Text style={styles.citaDetalle}>
            {formatFecha(item.cita_fecha)}
            {item.cita_lugar ? ` — ${item.cita_lugar}` : ''}
          </Text>
        </View>
      )}

      {/* Contenido */}
      <Text style={styles.contenido}>{item.contenido}</Text>

      {/* Foto */}
      {item.foto && (
        <Image
          source={{ uri: `${API_BASE}/storage/${item.foto}` }}
          style={styles.foto}
          resizeMode="contain"
        />
      )}

      {/* Acciones */}
      <View style={styles.acciones}>
        <TouchableOpacity style={styles.accionBoton} onPress={() => onLike(item.id)}>
          <Text style={styles.accionTexto}>
            {item.yo_di_like ? '❤️' : '🤍'} {item.likes_count}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.accionBoton}
          onPress={() => setMostrarComentarios(!mostrarComentarios)}
        >
          <Text style={styles.accionTexto}>
            💬 {item.comentarios?.length ?? 0}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comentarios */}
      {mostrarComentarios && (
        <View style={styles.comentariosContenedor}>
          {item.comentarios?.map((c) => (
            <View key={c.id} style={styles.comentario}>
              <Text style={styles.comentarioAutor}>{c.user?.name}</Text>
              <Text style={styles.comentarioTexto}>{c.contenido}</Text>
            </View>
          ))}
          <View style={styles.comentarioInput}>
            <TextInput
              style={styles.inputComentario}
              placeholder="Escribe un comentario..."
              value={comentario}
              onChangeText={setComentario}
              multiline
            />
            <TouchableOpacity
              style={styles.botonEnviar}
              onPress={handleComentar}
              disabled={enviando}
            >
              {enviando
                ? <ActivityIndicator color={COLORES.blanco} size="small" />
                : <Text style={styles.botonEnviarTexto}>➤</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

//Componente principal 
export function Foro() {
  const { usuario } = useAuth();
  const usuarioId   = usuario?.id;

  // Estados del foro
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando]           = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [modalVisible, setModalVisible]   = useState(false);

  // Estados del formulario
  const [contenido, setContenido]           = useState('');
  const [tipo, setTipo]                     = useState('normal');
  const [citaFecha, setCitaFecha]           = useState('');
  const [citaLugar, setCitaLugar]           = useState('');
  const [foto, setFoto]                     = useState(null);
  const [publicando, setPublicando]         = useState(false);

  // Estados del date picker (solo móvil)
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [mostrarTimePicker, setMostrarTimePicker] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

  // Cargar foro
  const cargarForo = useCallback(async (esRefresh = false) => {
    if (esRefresh) setRefreshing(true);
    else setCargando(true);
    try {
      const { data } = await axiosClient.get('/foro');
      setPublicaciones(data.data);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el foro');
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargarForo(); }, []);

  // ─── Acciones ────────────────────────────────────────────────────────────────
  const handleLike = async (publicacionId) => {
    try {
      const { data } = await axiosClient.post(`/foro/${publicacionId}/like`);
      setPublicaciones(prev => prev.map(p => {
        if (p.id !== publicacionId) return p;
        return { ...p, likes_count: data.likes_count, yo_di_like: data.accion === 'dado' };
      }));
    } catch (e) {
      Alert.alert('Error', 'No se pudo dar like');
    }
  };

  const handleComentar = async (publicacionId, contenidoComentario) => {
    try {
      const { data } = await axiosClient.post(`/foro/${publicacionId}/comentar`, {
        contenido: contenidoComentario,
      });
      setPublicaciones(prev => prev.map(p => {
        if (p.id !== publicacionId) return p;
        return { ...p, comentarios: [...(p.comentarios ?? []), data] };
      }));
    } catch (e) {
      Alert.alert('Error', 'No se pudo enviar el comentario');
    }
  };

  const handleEliminar = (publicacionId) => {
    Alert.alert('Eliminar', '¿Seguro que quieres eliminar esta publicación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await axiosClient.delete(`/foro/${publicacionId}`);
            setPublicaciones(prev => prev.filter(p => p.id !== publicacionId));
          } catch (e) {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        }
      }
    ]);
  };

//Seleccionar foto
const handleSeleccionarFoto = async () => {
  if (Platform.OS === 'web') {
    // En web usamos un input file nativo directamente
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setFoto({ file, uri: URL.createObjectURL(file) });
      }
    };
    input.click();
    return;
  }

  //Móvil
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (!result.canceled) setFoto(result.assets[0]);
};

const handlePublicar = async () => {
  if (!contenido.trim()) {
    Alert.alert('Error', 'Escribe algo para publicar');
    return;
  }
  if (tipo === 'cita' && !citaFecha.trim()) {
    Alert.alert('Error', 'Ingresa la fecha de la cita');
    return;
  }

  setPublicando(true);
  try {
    let responseData;

    const formData = new FormData();
    formData.append('contenido', contenido);
    formData.append('tipo', tipo);

    if (tipo === 'cita') {
      formData.append('cita_fecha', citaFecha);
      formData.append('cita_lugar', citaLugar);
    }

    if (foto) {
        if (Platform.OS === 'web') {
            formData.append('foto', foto.file, foto.file.name);
        } else {

            const uri = foto.uri;
            const extension = uri.split('.').pop().toLowerCase() || 'jpg';
            const mimeTypes = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
            const mimeType = mimeTypes[extension] ?? 'image/jpeg';

            formData.append('foto', {
            uri,
            name: `foto_${Date.now()}.${extension}`,
            type: mimeType,
            });
        }
        }

    const response = await axiosClient.post('/foro', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
      transformRequest: (data) => data,
    });

    responseData = response.data;

    setPublicaciones(prev => [responseData, ...prev]);
    setModalVisible(false);
    setContenido('');
    setTipo('normal');
    setCitaFecha('');
    setCitaLugar('');
    setFoto(null);

  } catch (e) {
    console.log('Error:', JSON.stringify(e.response?.data, null, 2));
    Alert.alert('Error', e.response?.data?.message ?? 'No se pudo publicar');
  } finally {
    setPublicando(false);
  }
};

  //Render
  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={COLORES.primario} />
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>

      {/* Botón nueva publicación */}
      <TouchableOpacity style={styles.botonNuevo} onPress={() => setModalVisible(true)}>
        <Text style={styles.botonNuevoTexto}>✏️ Nueva publicación</Text>
      </TouchableOpacity>

      {/* Lista */}
      <FlatList
        data={publicaciones}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => cargarForo(true)}
            colors={[COLORES.primario]}
          />
        }
        ListEmptyComponent={
          <View style={styles.centrado}>
            <Text style={styles.vacioPTexto}>Sin publicaciones aún. ¡Sé el primero!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TarjetaPublicacion
            item={item}
            usuarioId={usuarioId}
            onLike={handleLike}
            onComentar={handleComentar}
            onEliminar={handleEliminar}
          />
        )}
      />

      {/* Modal nueva publicación */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContenido}>
          <Text style={styles.modalTitulo}>Nueva publicación</Text>

          {/* Selector tipo */}
          <View style={styles.tipoContenedor}>
            <TouchableOpacity
              style={[styles.tipoBoton, tipo === 'normal' && styles.tipoActivo]}
              onPress={() => setTipo('normal')}
            >
              <Text style={[styles.tipoTexto, tipo === 'normal' && styles.tipoTextoActivo]}>📝 Normal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tipoBoton, tipo === 'cita' && styles.tipoActivo]}
              onPress={() => setTipo('cita')}
            >
              <Text style={[styles.tipoTexto, tipo === 'cita' && styles.tipoTextoActivo]}>📅 Cita médica</Text>
            </TouchableOpacity>
          </View>

          {/* Campos cita */}
          {tipo === 'cita' && (
            <View style={styles.citaContenedor}>
              <Text style={styles.citaLabel}>📅 Fecha y hora de la cita</Text>

              {Platform.OS === 'web' ? (
                <input
                  type="datetime-local"
                  style={{
                    width: '100%', padding: 14, fontSize: 16,
                    borderRadius: 10, border: '1px solid #bfdbfe',
                    marginBottom: 12, backgroundColor: '#fff', color: '#1d4ed8',
                    boxSizing: 'border-box',
                  }}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setCitaFecha(e.target.value.replace('T', ' '))}
                />
              ) : (
                <>
                  <TouchableOpacity style={styles.selectorBoton} onPress={() => setMostrarDatePicker(true)}>
                    <Text style={styles.selectorTexto}>{fechaSeleccionada.toLocaleDateString('es-CL')}</Text>
                  </TouchableOpacity>
                  {mostrarDatePicker && (
                    <DateTimePicker
                      value={fechaSeleccionada}
                      mode="date"
                      display="default"
                      minimumDate={new Date()}
                      onChange={(event, date) => {
                        setMostrarDatePicker(false);
                        if (date) {
                          const nueva = new Date(fechaSeleccionada);
                          nueva.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                          setFechaSeleccionada(nueva);
                          setCitaFecha(formatParaLaravel(nueva));
                        }
                      }}
                    />
                  )}
                  <TouchableOpacity style={styles.selectorBoton} onPress={() => setMostrarTimePicker(true)}>
                    <Text style={styles.selectorTexto}>
                      {fechaSeleccionada.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                  {mostrarTimePicker && (
                    <DateTimePicker
                      value={fechaSeleccionada}
                      mode="time"
                      display="default"
                      onChange={(event, date) => {
                        setMostrarTimePicker(false);
                        if (date) {
                          const nueva = new Date(fechaSeleccionada);
                          nueva.setHours(date.getHours(), date.getMinutes());
                          setFechaSeleccionada(nueva);
                          setCitaFecha(formatParaLaravel(nueva));
                        }
                      }}
                    />
                  )}
                </>
              )}

              <Text style={styles.citaLabel}>📍 Lugar (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Hospital San Juan"
                value={citaLugar}
                onChangeText={setCitaLugar}
              />
            </View>
          )}

          {/* Contenido */}
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="¿Qué quieres compartir?"
            value={contenido}
            onChangeText={setContenido}
            multiline
            numberOfLines={4}
          />

          {/* Foto */}
          <TouchableOpacity style={styles.botonFoto} onPress={handleSeleccionarFoto}>
            <Text style={styles.botonFotoTexto}>
              {foto ? '✅ Foto seleccionada' : '📷 Agregar foto'}
            </Text>
          </TouchableOpacity>
          {foto && <Image source={{ uri: foto.uri }} style={styles.fotoPrevia} resizeMode="cover" />}

          {/* Acciones modal */}
          <TouchableOpacity
            style={[styles.botonPublicar, publicando && { opacity: 0.7 }]}
            onPress={handlePublicar}
            disabled={publicando}
          >
            {publicando
              ? <ActivityIndicator color={COLORES.blanco} />
              : <Text style={styles.botonPublicarTexto}>Publicar</Text>
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

//Estilos
const styles = StyleSheet.create({
  // Layout
  contenedor:            { flex: 1, backgroundColor: COLORES.fondo },
  centrado:              { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  // Lista
  vacioPTexto:           { color: COLORES.textoGris, fontSize: FUENTES.medio },
  botonNuevo:            { margin: 16, backgroundColor: COLORES.primario, borderRadius: 12, padding: 14, alignItems: 'center' },
  botonNuevoTexto:       { color: COLORES.blanco, fontWeight: 'bold', fontSize: FUENTES.medio },

  // Tarjeta
  tarjeta:               { backgroundColor: COLORES.blanco, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORES.borde },
  tarjetaHeader:         { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  avatar:                { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORES.primario, justifyContent: 'center', alignItems: 'center' },
  avatarTexto:           { color: COLORES.blanco, fontWeight: 'bold', fontSize: 18 },
  autorNombre:           { fontWeight: 'bold', color: COLORES.primario, fontSize: FUENTES.medio },
  fecha:                 { fontSize: 11, color: COLORES.textoGris },
  eliminar:              { fontSize: 18, padding: 4 },
  contenido:             { fontSize: FUENTES.medio, color: '#1f2937', lineHeight: 22, marginBottom: 10 },
  foto:                  { width: '100%', height: 200, borderRadius: 10, marginBottom: 10 },

  // Cita badge
  citaBadge:             { backgroundColor: '#eff6ff', borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  citaBadgeTexto:        { color: '#1d4ed8', fontWeight: 'bold', fontSize: 12 },
  citaDetalle:           { color: '#1d4ed8', fontSize: 12, marginTop: 4 },

  // Acciones
  acciones:              { flexDirection: 'row', gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORES.borde },
  accionBoton:           { flexDirection: 'row', alignItems: 'center', gap: 4 },
  accionTexto:           { fontSize: FUENTES.medio, color: COLORES.textoGris },

  // Comentarios
  comentariosContenedor: { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORES.borde, paddingTop: 10 },
  comentario:            { marginBottom: 8 },
  comentarioAutor:       { fontWeight: 'bold', color: COLORES.primario, fontSize: 12 },
  comentarioTexto:       { fontSize: 13, color: '#374151' },
  comentarioInput:       { flexDirection: 'row', gap: 8, marginTop: 8 },
  inputComentario:       { flex: 1, borderWidth: 1, borderColor: COLORES.borde, borderRadius: 8, padding: 8, fontSize: 13, backgroundColor: COLORES.fondo },
  botonEnviar:           { backgroundColor: COLORES.primario, borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  botonEnviarTexto:      { color: COLORES.blanco, fontWeight: 'bold' },

  // Modal
  modalContenido:        { padding: 24, paddingTop: 60 },
  modalTitulo:           { fontSize: 22, fontWeight: 'bold', color: COLORES.primario, marginBottom: 20 },
  tipoContenedor:        { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tipoBoton:             { flex: 1, borderWidth: 1, borderColor: COLORES.borde, borderRadius: 10, padding: 12, alignItems: 'center', backgroundColor: COLORES.blanco },
  tipoActivo:            { borderColor: COLORES.primario, backgroundColor: '#f0fdf4' },
  tipoTexto:             { fontSize: FUENTES.medio, color: COLORES.textoGris },
  tipoTextoActivo:       { color: COLORES.primario, fontWeight: 'bold' },

  // Cita form
  citaContenedor:        { backgroundColor: '#eff6ff', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  citaLabel:             { fontSize: 13, fontWeight: '600', color: '#1d4ed8', marginBottom: 6 },
  selectorBoton:         { backgroundColor: COLORES.blanco, borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 10, padding: 14, marginBottom: 12 },
  selectorTexto:         { fontSize: FUENTES.medio, color: '#1d4ed8', fontWeight: '600', textAlign: 'center' },

  // Inputs
  input:                 { backgroundColor: COLORES.blanco, borderWidth: 1, borderColor: COLORES.borde, borderRadius: 10, padding: 14, fontSize: FUENTES.medio, marginBottom: 12 },
  inputMultiline:        { height: 120, textAlignVertical: 'top' },

  // Foto
  botonFoto:             { borderWidth: 1, borderColor: COLORES.borde, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 12, borderStyle: 'dashed' },
  botonFotoTexto:        { color: COLORES.textoGris, fontSize: FUENTES.medio },
  fotoPrevia:            { width: '100%', height: 180, borderRadius: 10, marginBottom: 12 },

  // Botones modal
  botonPublicar:         { backgroundColor: COLORES.primario, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 10 },
  botonPublicarTexto:    { color: COLORES.blanco, fontWeight: 'bold', fontSize: FUENTES.medio },
  botonCancelar:         { padding: 14, alignItems: 'center' },
  botonCancelarTexto:    { color: COLORES.textoGris, fontSize: FUENTES.medio },
});