import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { COLORES, FUENTES } from "../constants/theme";

interface Usuario {
  id: number;
  name: string;
  email: string;
}

export default function HomeScreen() {
  const { usuario } = useAuth() as { usuario: Usuario | null };

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.header}>
        <Text style={styles.saludo}>Bienvenido 👋</Text>
        <Text style={styles.nombre}>{usuario?.name}</Text>
        <Text style={styles.email}>{usuario?.email}</Text>
      </View>

      <View style={styles.cuerpo}>
        <Text style={styles.seccion}>Panel principal</Text>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaTitulo}>✅ Sesión activa</Text>
          <Text style={styles.tarjetaTexto}>
            Has iniciado sesión correctamente con Sanctum.
          </Text>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaTitulo}>🔐 Token Bearer</Text>
          <Text style={styles.tarjetaTexto}>
            Tu token está guardado en AsyncStorage y se envía automáticamente en cada petición.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  header: {
    padding: 24,
    backgroundColor: COLORES.blanco,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },
  saludo: { fontSize: FUENTES.medio, color: COLORES.textoGris },
  nombre: { fontSize: 20, fontWeight: "bold", color: COLORES.primario },
  email: { fontSize: 12, color: COLORES.textoGris, marginTop: 2 },
  cuerpo: { padding: 24 },
  seccion: { fontSize: FUENTES.medio, fontWeight: "bold", color: COLORES.primario, marginBottom: 16 },
  tarjeta: {
    backgroundColor: COLORES.blanco,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORES.borde,
    marginBottom: 12,
  },
  tarjetaTitulo: { fontSize: FUENTES.medio, fontWeight: "bold", marginBottom: 6 },
  tarjetaTexto: { fontSize: 12, color: COLORES.textoGris, lineHeight: 20 },
});