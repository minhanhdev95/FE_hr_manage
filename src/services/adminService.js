import axios from '../api/axiosConfig';

const adminService = {

    findAll: (request, page, size) =>
        axios.post(`/api/admin/quan-ly-cong-viec?page=${page}&size=${size}`, request),

    findOne: (uuid) =>
        axios.post(`/api/admin/find-one-by-uuid?uuid=${uuid}`),

    update: (data) =>
        axios.post(`/api/admin/update`, data),

    getNhanSu: () =>
        axios.get('/api/admin/nhan-su'),

    tongquan: (thoiGian) =>
        axios.get(`/api/admin/tong-quan-du-an?thoiGian=${thoiGian}`),


};

export default adminService;