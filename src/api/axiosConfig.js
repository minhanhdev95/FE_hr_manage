import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8081/hr-management',
});

// Trước khi gửi request đi
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`; // Gắn token vào header
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Khi nhận response về
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Nếu token hết hạn hoặc không hợp lệ, sút người dùng về trang login
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default instance;