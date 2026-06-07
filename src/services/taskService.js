// CHÚ Ý: Import cái instance bạn đã tạo, ĐỪNG import từ 'axios' trực tiếp
import axios from '../api/axiosConfig';

const API_BASE_URL = '/api/cong-viec';

const taskService = {
    findAll: (request, page, size) =>
        axios.post(`${API_BASE_URL}/find-all?page=${page}&size=${size}`, request),

    insert: (data) =>
        axios.post(`${API_BASE_URL}/insert`, data),

    update: (data) =>
        axios.post(`${API_BASE_URL}/update`, data),

    delete: (uuid) =>
        axios.post(`${API_BASE_URL}/delete?uuid=${uuid}`),

    findOne: (uuid) =>
        axios.get(`${API_BASE_URL}/find-one-by-uuid?uuid=${uuid}`),

    // Lấy dữ liệu tiến độ công việc theo thời gian (định dạng MM-YYYY).
    // BE: @GetMapping("/get-tien-do") -> congViecService.getTienDoCongViec(thoiGian)
    getTienDo: (thoiGian) =>
        axios.get(`${API_BASE_URL}/get-tien-do?thoiGian=${encodeURIComponent(thoiGian)}`),
};

export default taskService;