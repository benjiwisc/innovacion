import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosClient from '../lib/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const token = await AsyncStorage.getItem('auth_token');
                if (token) {
                    const { data } = await axiosClient.get('/user');
                    setUsuario(data);
                }
            } catch {
                await AsyncStorage.removeItem('auth_token');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = async ({ email, password }) => {
        const { data } = await axiosClient.post('/login', { email, password });
        await AsyncStorage.setItem('auth_token', data.token);
        setUsuario(data.user);
    };

    const register = async ({ name, email, password, password_confirmation, rol, codigo_adulto_mayor }) => {
        const { data } = await axiosClient.post('/register', {
            name, email, password, password_confirmation, rol, codigo_adulto_mayor,
        });
        await AsyncStorage.setItem('auth_token', data.token);
        setUsuario(data.user);
    };

    const logout = async () => {
        try {
            await axiosClient.post('/logout');
        } catch (e) {
            console.log('error logout:', e?.response?.status, e?.message);
        } finally {
            await AsyncStorage.removeItem('auth_token');
            setUsuario(null);
        }
    };

    return (
        <AuthContext.Provider value={{ usuario, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
    return context;
}