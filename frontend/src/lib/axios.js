import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosClient = axios.create({
    baseURL: 'http://api.rentacarencoyhaique2.cl/api',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

axiosClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;