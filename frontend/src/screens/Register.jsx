import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView
} from "react-native";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { COLORES, FUENTES } from "../constants/theme";

const ROLES = [
  { valor: 'adulto_mayor', etiqueta: '👴 Adulto Mayor' },
  { valor: 'familiar',     etiqueta: '👨‍👩‍👧 Familiar'     },
  { valor: 'cuidador',     etiqueta: '🧑‍⚕️ Cuidador'     },
];

/** @param {{ onVolverLogin: () => void }} props */
export function Register({ onVolverLogin }) {
  const [name, setName]                       = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [rol, setRol]                         = useState("");
  const [codigoAdulto, setCodigoAdulto]       = useState("");
  const [error, setError]                     = useState(null);
  const [cargando, setCargando]               = useState(false);
  const { register } = useAuth();

  const necesitaCodigo = rol === 'familiar' || rol === 'cuidador';

  const handleRegister = async () => {
    setError(null);

    if (!rol) {
      setError("Selecciona un tipo de usuario");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (necesitaCodigo && !codigoAdulto.trim()) {
      setError("Ingresa el código del adulto mayor");
      return;
    }

    setCargando(true);
    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirm,
        rol,
        codigo_adulto_mayor: necesitaCodigo ? codigoAdulto.trim().toUpperCase() : undefined,
      });
    } catch (err) {
      const errores = err.response?.data?.errors;
      if (errores) {
        const primero = Object.values(errores)[0][0];
        setError(primero);
      } else {
        setError(err.response?.data?.message ?? "Error al conectar con el servidor");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>MediApp</Text>
      <Text style={styles.subtitulo}>Crear cuenta</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

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

      <TextInput
        style={styles.input}
        placeholder="Confirmar contraseña"
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        secureTextEntry
      />

      {/* Selector de rol */}
      <Text style={styles.label}>Tipo de usuario</Text>
      <View style={styles.rolesContenedor}>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.valor}
            style={[styles.rolBoton, rol === r.valor && styles.rolBotonActivo]}
            onPress={() => {
              setRol(r.valor);
              setCodigoAdulto("");
            }}
          >
            <Text style={[styles.rolTexto, rol === r.valor && styles.rolTextoActivo]}>
              {r.etiqueta}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Campo código — solo para familiar y cuidador */}
      {necesitaCodigo && (
        <View style={styles.codigoContenedor}>
          <Text style={styles.codigoLabel}>
            🔑 Ingresa el código del adulto mayor
          </Text>
          <TextInput
            style={[styles.input, styles.codigoInput]}
            placeholder="Ej: AB12CD34"
            value={codigoAdulto}
            onChangeText={setCodigoAdulto}
            autoCapitalize="characters"
            maxLength={8}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.boton, cargando && { opacity: 0.7 }]}
        onPress={handleRegister}
        disabled={cargando}
      >
        {cargando
          ? <ActivityIndicator color={COLORES.blanco} />
          : <Text style={styles.botonTexto}>Registrarse</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.link} onPress={onVolverLogin}>
        <Text style={styles.linkTexto}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
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
  label: {
    fontSize: FUENTES.medio,
    fontWeight: "bold",
    color: COLORES.primario,
    marginBottom: 10,
  },
  rolesContenedor: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  rolBoton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    backgroundColor: COLORES.blanco,
  },
  rolBotonActivo: {
    borderColor: COLORES.primario,
    backgroundColor: '#f0fdf4',
  },
  rolTexto: {
    fontSize: 12,
    color: COLORES.textoGris,
    textAlign: "center",
  },
  rolTextoActivo: {
    color: COLORES.primario,
    fontWeight: "bold",
  },
  codigoContenedor: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  codigoLabel: {
    fontSize: 13,
    color: '#92400e',
    marginBottom: 10,
    fontWeight: '600',
  },
  codigoInput: {
    marginBottom: 0,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: 'bold',
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
  link: {
    marginTop: 20,
    alignItems: "center",
  },
  linkTexto: {
    color: COLORES.primario,
    fontSize: FUENTES.medio,
  },
  error: {
    color: COLORES.rojo,
    textAlign: "center",
    marginBottom: 12,
  },
});