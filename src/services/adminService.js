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

    getDsNhanSuQuanLy: () =>
        axios.get('/api/admin/quan-ly-nhan-su'),

    tongquan: (thoiGian) =>
        axios.get(`/api/admin/tong-quan-du-an?thoiGian=${thoiGian}`),

    insertCongViec: (data) =>
        axios.post(`/api/admin/giao-cong-viec?nhanSuId=${data.nhanSuIds[0]}`, {
            noiDungCongViec: data.noiDungCongViec,
            loaiCongViecId: data.loaiCongViecId,
            maCongViec: data.maCongViec,
            noLucThucHien: data.noLucThucHien,
            trangThaiId: data.trangThaiId,
            sanPhamId: data.sanPhamId,
            nhanSuIds: data.nhanSuIds,
            ngayBatDau: data.ngayBatDau,
            ngayKetThuc: data.ngayKetThuc
        }),


};

export default adminService;