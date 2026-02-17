import axios from 'axios';

// 生产环境使用环境变量，开发环境使用 localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
