import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { COLORES, FUENTES } from "../constants/theme";

export function Login({ onIrRegistro }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setError(null);
    setCargando(true);
    try {
      await login({ email, password });

    } catch (err) {
      const mensaje = err.response?.data?.message
        ?? err.response?.data?.errors?.email?.[0]
        ?? "Error al conectar con el servidor";
      setError(mensaje);
    } finally {
      setCargando(false);
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

      <TouchableOpacity
        style={[styles.boton, cargando && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={cargando}
      >
        {cargando
          ? <ActivityIndicator color={COLORES.blanco} />
          : <Text style={styles.botonTexto}>Ingresar</Text>
        }
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={onIrRegistro}>
        <Text style={styles.linkTexto}>¿No tienes cuenta? Regístrate</Text>
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
  link: { marginTop: 20, alignItems: "center" },
  linkTexto: { color: COLORES.primario, fontSize: FUENTES.medio },
});