import axios from "../api/axiosConfig";

const danhMucService = {
  /**
   * Định nghĩa các hằng số tên bảng chuẩn theo Enum ở Back-end.
   */
  TABLES: {
    LOAI_CONG_VIEC: "LOAI_CONG_VIEC",
    TRANG_THAI_CONG_VIEC: "TRANG_THAI_CONG_VIEC",
    SAN_PHAM: "SAN_PHAM",
    DM_GIOI_TINH: "DM_GIOI_TINH",
    DM_DAN_TOC: "DM_DAN_TOC",
  },

  /**
   * Lấy danh sách toàn bộ dữ liệu của một danh mục
   * @param {string} nameOfTable - Tên bảng (Ví dụ: 'LOAI_CONG_VIEC')
   */
  findAll: async (nameOfTable) => {
    const response = await axios.get("/api/danh-muc/find-all", {
      params: { nameOfTable: nameOfTable },
    });
    return response.data; // Trả về data trực tiếp giống authService
  },

  /**
   * Lấy chi tiết một phần tử danh mục theo ID
   */
  findById: async (nameOfTable, id) => {
    const response = await axios.get("/api/danh-muc/find-by-id", {
      params: {
        nameOfTable: nameOfTable,
        id: id,
      },
    });
    return response.data;
  },
  /**
   * Thêm mới một danh mục
   * @param {object} request - payload giống DanhMucRequest
   * @param {string} nameOfTable - tên bảng (VD: DM_GIOI_TINH)
   */
  themMoiDanhMuc: async (request, nameOfTable) => {
    const response = await axios.post(
      "/api/danh-muc/them-moi-danh-muc",
      request,
      {
        params: { nameOfTable: nameOfTable },
      },
    );
    return response.data;
  },

  /**
   * Cập nhật một danh mục
   * @param {object} request - payload giống DanhMucRequest
   * @param {string} nameOfTable - tên bảng (VD: DM_GIOI_TINH)
   */
  capNhatDanhMuc: async (request, nameOfTable) => {
    const response = await axios.post("/api/admin/cap-nhat-danh-muc", request, {
      params: { nameOfTable: nameOfTable },
    });
    return response.data;
  },
  themMoiDanhMuc: async (request, nameOfTable) => {
    const response = await axios.post("/api/admin/them-moi-danh-muc", request, {
      params: { nameOfTable: nameOfTable },
    });
    return response.data;
  },
};

export default danhMucService;
