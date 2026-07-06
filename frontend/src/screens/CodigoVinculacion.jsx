import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, Share, Alert
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { COLORES, FUENTES } from "../constants/theme";

/** @param {{ usuario: { name: string, codigo_vinculacion: string | null } }} props */
export function CodigoVinculacion({ usuario }) {
  const handleCompartir = async () => {
    try {
      await Share.share({
        message: `Hola, soy ${usuario.name}. Usa este código para vincularte conmigo en MediApp: ${usuario.codigo_vinculacion}`,
        title: 'Mi código MediApp',
      });
    } catch (e) {
      Alert.alert('Error', 'No se pudo compartir el código');
    }
  };

  if (!usuario.codigo_vinculacion) {
    return (
      <View style={styles.contenedor}>
        <Text style={styles.errorTexto}>No tienes un código asignado.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContenedor} style={styles.contenedor}>
      <Text style={styles.titulo}>Tu código de vinculación</Text>
      <Text style={styles.subtitulo}>
        Usa este código para conectar tu pastillero físico a internet o compartirlo con tus familiares.
      </Text>

      {/* Código grande */}
      <View style={styles.codigoContenedor}>
        <Text style={styles.codigo}>{usuario.codigo_vinculacion}</Text>
      </View>

      <Text style={styles.hint}>
        📋 Toca el botón para compartir tu código
      </Text>

      <TouchableOpacity style={styles.boton} onPress={handleCompartir}>
        <Text style={styles.botonTexto}>📤 Compartir código</Text>
      </TouchableOpacity>

      {/* Info Vinculación Familiar */}
      <View style={styles.infoContenedor}>
        <Text style={styles.infoTitulo}>👥 Vincular con Familiar o Cuidador</Text>
        <Text style={styles.infoTexto}>
          1. Comparte este código con tu familiar o cuidador.{"\n"}
          2. Ellos lo ingresan al registrarse en MediApp.{"\n"}
          3. Podrán ver tu estado y si has tomado tus medicamentos.
        </Text>
      </View>

      {/* Info Vinculación Pastillero */}
      <View style={[styles.infoContenedor, { marginTop: 16, backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
        <Text style={[styles.infoTitulo, { color: '#1e40af' }]}>📡 Vincular con tu Pastillero Físico</Text>
        <Text style={styles.infoTexto}>
          1. Enciende tu pastillero inteligente.{"\n"}
          2. Conéctate desde tu celular al WiFi llamado <Text style={{fontWeight: 'bold'}}>"Pastillero_Config"</Text>.{"\n"}
          3. Se abrirá la configuración: selecciona tu red WiFi, ingresa la contraseña y luego escribe este código: <Text style={{fontWeight: 'bold', color: COLORES.primario}}>{usuario.codigo_vinculacion}</Text>.{"\n"}
          4. ¡Guarda la configuración y listo!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  scrollContenedor: {
    padding: 24,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORES.primario,
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  subtitulo: {
    fontSize: FUENTES.medio,
    color: COLORES.textoGris,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  codigoContenedor: {
    backgroundColor: COLORES.blanco,
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 24,
    borderWidth: 2,
    borderColor: COLORES.primario,
    marginBottom: 16,
  },
  codigo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORES.primario,
    letterSpacing: 8,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    color: COLORES.textoGris,
    marginBottom: 24,
  },
  boton: {
    backgroundColor: COLORES.primario,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  botonTexto: {
    color: COLORES.blanco,
    fontWeight: 'bold',
    fontSize: FUENTES.medio,
  },
  infoContenedor: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  infoTitulo: {
    fontSize: FUENTES.medio,
    fontWeight: 'bold',
    color: COLORES.primario,
    marginBottom: 8,
  },
  infoTexto: {
    fontSize: 13,
    color: COLORES.textoGris,
    lineHeight: 22,
  },
  errorTexto: {
    color: COLORES.rojo,
    fontSize: FUENTES.medio,
  },
});