// Tiện ích phân loại & hiển thị trạng thái công việc.
// Lý do: tên/ID trạng thái lấy từ danh mục Back-end, nên ta phân loại theo "lớp"
// (class) dựa trên tên để không phụ thuộc cứng vào ID.

export const TRANG_THAI = {
  CHO_PHE_DUYET: 'CHO_PHE_DUYET', // Chờ phê duyệt
  DA_TIEP_NHAN: 'DA_TIEP_NHAN',   // Đã tiếp nhận / Đã phê duyệt
  TU_CHOI: 'TU_CHOI',             // Từ chối (phê duyệt)
  DANG_THUC_HIEN: 'DANG_THUC_HIEN', // Đang thực hiện
  DA_HOAN_THANH: 'DA_HOAN_THANH', // Đã hoàn thành
  KHAC: 'KHAC',
};

// ID dự phòng — chỉ dùng khi không tìm được trạng thái theo tên trong danh mục.
export const TRANG_THAI_ID_FALLBACK = {
  [TRANG_THAI.CHO_PHE_DUYET]: 1,
  [TRANG_THAI.DA_TIEP_NHAN]: 2,
  [TRANG_THAI.TU_CHOI]: 3,
  [TRANG_THAI.DANG_THUC_HIEN]: 4,
  [TRANG_THAI.DA_HOAN_THANH]: 5,
};

// Phân loại một tên trạng thái về một "lớp" chuẩn.
export const classifyTrangThai = (name) => {
  const n = String(name || '').toLowerCase().trim();
  if (!n) return TRANG_THAI.KHAC;
  if (n.includes('chờ')) return TRANG_THAI.CHO_PHE_DUYET; // "Chờ phê duyệt"
  if (n.includes('từ chối')) return TRANG_THAI.TU_CHOI; // "Từ chối"
  if (n.includes('hoàn thành')) return TRANG_THAI.DA_HOAN_THANH; // "Đã hoàn thành"
  if (n.includes('thực hiện')) return TRANG_THAI.DANG_THUC_HIEN; // "Đang thực hiện"
  if (n.includes('tiếp nhận') || n.includes('phê duyệt')) return TRANG_THAI.DA_TIEP_NHAN; // "Đã tiếp nhận"/"Đã phê duyệt"
  return TRANG_THAI.KHAC;
};

// Màu cho biểu đồ (donut).
export const TRANG_THAI_COLOR = {
  [TRANG_THAI.CHO_PHE_DUYET]: '#8c8c8c',
  [TRANG_THAI.DA_TIEP_NHAN]: '#fa8c16',
  [TRANG_THAI.TU_CHOI]: '#f5222d',
  [TRANG_THAI.DANG_THUC_HIEN]: '#1890ff',
  [TRANG_THAI.DA_HOAN_THANH]: '#52c41a',
  [TRANG_THAI.KHAC]: '#bfbfbf',
};

// Màu cho Tag của Ant Design.
export const TRANG_THAI_TAG_COLOR = {
  [TRANG_THAI.CHO_PHE_DUYET]: 'default',
  [TRANG_THAI.DA_TIEP_NHAN]: 'orange',
  [TRANG_THAI.TU_CHOI]: 'red',
  [TRANG_THAI.DANG_THUC_HIEN]: 'blue',
  [TRANG_THAI.DA_HOAN_THANH]: 'green',
  [TRANG_THAI.KHAC]: 'default',
};

// Nhãn mặc định cho mỗi lớp trạng thái.
export const TRANG_THAI_LABEL = {
  [TRANG_THAI.CHO_PHE_DUYET]: 'Chờ phê duyệt',
  [TRANG_THAI.DA_TIEP_NHAN]: 'Đã tiếp nhận',
  [TRANG_THAI.TU_CHOI]: 'Từ chối',
  [TRANG_THAI.DANG_THUC_HIEN]: 'Đang thực hiện',
  [TRANG_THAI.DA_HOAN_THANH]: 'Đã hoàn thành',
  [TRANG_THAI.KHAC]: 'Khác',
};

// Chuẩn hoá danh sách danh mục về dạng { id, ten } dù đầu vào là {value,label} hay {id,ten}.
const normalizeList = (statuses) =>
  (statuses || []).map((s) => ({
    id: s.value !== undefined ? s.value : s.id,
    ten: s.label !== undefined ? s.label : s.ten,
  }));

// Tìm ID trạng thái thực tế (trong danh mục) theo lớp; nếu không có thì dùng ID dự phòng.
export const resolveTrangThaiId = (statuses, classKey) => {
  const found = normalizeList(statuses).find((s) => classifyTrangThai(s.ten) === classKey);
  return found && found.id !== undefined && found.id !== null
    ? Number(found.id)
    : TRANG_THAI_ID_FALLBACK[classKey];
};

// Tìm nhãn (tên) trạng thái theo lớp từ danh mục; fallback về nhãn mặc định.
export const resolveTrangThaiLabel = (statuses, classKey) => {
  const found = normalizeList(statuses).find((s) => classifyTrangThai(s.ten) === classKey);
  return found && found.ten ? String(found.ten) : TRANG_THAI_LABEL[classKey];
};
