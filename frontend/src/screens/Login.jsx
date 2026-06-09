import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "expo-router";
import { COLORES, FUENTES } from "../constants/theme";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    // Por ahora con datos falsos
    if (email === "juan@mail.com" && password === "1234") {
      login({ nombre: "Juan Pérez", email });
      router.replace("/");  // va al menú principal
    } else {
      setError("Email o contraseña incorrectos");
    }
  };

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>MediApp</Text>
      <Text style={styles.subtitulo}>Ingresa tu cuenta</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.boton} onPress={handleLogin}>
        <Text style={styles.botonTexto}>Ingresar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: COLORES.fondo,
  },
  titulo: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORES.primario,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: FUENTES.medio,
    color: COLORES.textoGris,
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: COLORES.blanco,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 10,
    padding: 14,
    fontSize: FUENTES.medio,
    marginBottom: 12,
  },
  boton: {
    backgroundColor: COLORES.primario,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  botonTexto: {
    color: COLORES.blanco,
    fontWeight: "bold",
    fontSize: FUENTES.medio,
  },
  error: {
    color: COLORES.rojo,
    textAlign: "center",
    marginBottom: 12,
  },
});