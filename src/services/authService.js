import axios from '../api/axiosConfig';

const authService = {
    login: async(username, password) => {
        const response = await axios.post('/api/auth/login', { username, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token); // Lưu token lại
        }
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
};

export default authService;