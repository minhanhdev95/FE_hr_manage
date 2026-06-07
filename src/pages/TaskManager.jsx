import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Card,
  Row,
  Col,
  Tooltip,
  Alert,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import taskService from "../services/taskService";
import danhMucService from "../services/danhMucService";
import dayjs from "dayjs";
import {
  classifyTrangThai,
  resolveTrangThaiId,
  resolveTrangThaiLabel,
  TRANG_THAI,
  TRANG_THAI_TAG_COLOR,
} from "../utils/trangThaiCongViec";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

// Các bước trạng thái mà USER được phép tự cập nhật (luồng tuyến tính, đơn giản nhất):
//   Đã tiếp nhận (đã phê duyệt)  ->  Đang thực hiện  ->  Đã hoàn thành
const NEXT_STATUS_MAP = {
  [TRANG_THAI.DA_TIEP_NHAN]: [TRANG_THAI.DANG_THUC_HIEN],
  [TRANG_THAI.DANG_THUC_HIEN]: [TRANG_THAI.DA_HOAN_THANH],
};

const TaskManager = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();

  // Modal Thêm/Sửa
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingClass, setEditingClass] = useState(null); // lớp trạng thái của bản ghi đang sửa

  // Modal Xem chi tiết
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);

  // Modal Cập nhật trạng thái
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusRecord, setStatusRecord] = useState(null);
  const [nextStatusId, setNextStatusId] = useState(null);

  // Phân trang
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [currentFilters, setCurrentFilters] = useState({});

  // Danh mục
  const [products, setProducts] = useState([]);
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const loadCategories = async () => {
    try {
      const [resProd, resType, resStatus] = await Promise.all([
        danhMucService.findAll(danhMucService.TABLES.SAN_PHAM),
        danhMucService.findAll(danhMucService.TABLES.LOAI_CONG_VIEC),
        danhMucService.findAll(danhMucService.TABLES.TRANG_THAI_CONG_VIEC),
      ]);
      const mapData = (arr) =>
        (arr || []).map((item) => ({
          value: item.id ? Number(item.id) : item.id,
          label: String(item.ten || ""),
        }));
      setProducts(mapData(resProd));
      setTypes(mapData(resType));
      setStatuses(mapData(resStatus));
    } catch (error) {
      message.error("Không thể tải dữ liệu danh mục");
    }
  };

  const fetchData = async (page = 1, size = 10, filters = currentFilters) => {
    setLoading(true);
    try {
      const res = await taskService.findAll(filters, page - 1, size);
      setData(res.data || []);
      const totalRecords =
        res.data && res.data.length > 0 ? res.data[0].tongSoBanGhi : 0;
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: size,
        total: totalRecords,
      }));
    } catch (error) {
      message.error("Không thể tải danh sách công việc");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
    fetchData(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = () =>
    fetchData(pagination.current, pagination.pageSize, currentFilters);

  const handleTableChange = (newPagination) => {
    fetchData(newPagination.current, newPagination.pageSize, currentFilters);
  };

  const handleFilter = () => {
    const values = filterForm.getFieldsValue();
    const filters = {
      ...values,
      ngayBatDau: values.rangeDate
        ? values.rangeDate[0].format("DD-MM-YYYY")
        : null,
      ngayKetThuc: values.rangeDate
        ? values.rangeDate[1].format("DD-MM-YYYY")
        : null,
    };
    delete filters.rangeDate;
    setCurrentFilters(filters);
    fetchData(1, pagination.pageSize, filters);
  };

  // ---- Phân loại trạng thái của 1 bản ghi ----
  const getRecordClass = (record) => {
    const name =
      record.trangThaiTen ||
      statuses.find((s) => s.value === Number(record.trangThaiId))?.label;
    return classifyTrangThai(name);
  };

  // ---- Thêm mới ----
  const openAdd = () => {
    setEditingId(null);
    setEditingClass(null);
    form.resetFields();
    setIsFormOpen(true);
  };

  // ---- Sửa (chỉ cho "Chờ phê duyệt" hoặc "Từ chối") ----
  const openEdit = (record, cls) => {
    setEditingId(record.uuid);
    setEditingClass(cls);
    form.setFieldsValue({
      noiDungCongViec: record.noiDungCongViec,
      maCongViec: record.maCongViec,
      sanPhamId: record.sanPhamId ? Number(record.sanPhamId) : null,
      loaiCongViecId: record.loaiCongViecId
        ? Number(record.loaiCongViecId)
        : null,
      noLucThucHien: record.noLucThucHien,
      ngayBatDau: record.ngayBatDauString
        ? dayjs(record.ngayBatDauString, "DD-MM-YYYY")
        : record.ngayBatDau
          ? dayjs(record.ngayBatDau)
          : null,
      ngayKetThuc: record.ngayKetThucString
        ? dayjs(record.ngayKetThucString, "DD-MM-YYYY")
        : record.ngayKetThuc
          ? dayjs(record.ngayKetThuc)
          : null,
    });
    setIsFormOpen(true);
  };

  const handleSaveForm = async () => {
    try {
      const values = await form.validateFields();
      // Thêm mới, sửa khi đang "Chờ phê duyệt", hoặc sửa lại đơn bị "Từ chối"
      // => trạng thái luôn về "Chờ phê duyệt" (xin phê duyệt / xin phê duyệt lại).
      const choPheDuyetId = resolveTrangThaiId(
        statuses,
        TRANG_THAI.CHO_PHE_DUYET,
      );
      const payload = {
        ...values,
        uuid: editingId,
        ngayBatDau: values.ngayBatDau
          ? values.ngayBatDau.format("DD-MM-YYYY")
          : null,
        ngayKetThuc: values.ngayKetThuc
          ? values.ngayKetThuc.format("DD-MM-YYYY")
          : null,
        trangThaiId: choPheDuyetId,
      };

      if (editingId) {
        await taskService.update(payload);
        message.success(
          editingClass === TRANG_THAI.TU_CHOI
            ? "Đã gửi yêu cầu phê duyệt lại"
            : "Cập nhật thành công",
        );
      } else {
        await taskService.insert(payload);
        message.success("Đã tạo công việc và gửi yêu cầu phê duyệt");
      }
      setIsFormOpen(false);
      refresh();
    } catch (err) {
      if (err?.errorFields) return; // lỗi validate form -> antd tự hiển thị
      message.error("Có lỗi xảy ra khi lưu dữ liệu");
    }
  };

  // ---- Xem chi tiết ----
  const openDetail = (record) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  // ---- Cập nhật trạng thái (chỉ "Đã tiếp nhận" -> "Đang thực hiện" -> "Đã hoàn thành") ----
  const openUpdateStatus = (record, cls) => {
    const nextClasses = NEXT_STATUS_MAP[cls] || [];
    const firstNextId = nextClasses.length
      ? resolveTrangThaiId(statuses, nextClasses[0])
      : null;
    setStatusRecord(record);
    setNextStatusId(firstNextId);
    setStatusOpen(true);
  };

  const buildPayload = (record, overrides = {}) => ({
    uuid: record.uuid,
    maCongViec: record.maCongViec,
    noiDungCongViec: record.noiDungCongViec,
    sanPhamId: record.sanPhamId != null ? Number(record.sanPhamId) : null,
    loaiCongViecId:
      record.loaiCongViecId != null ? Number(record.loaiCongViecId) : null,
    noLucThucHien: record.noLucThucHien,
    ngayBatDau:
      record.ngayBatDauString ||
      (record.ngayBatDau
        ? dayjs(record.ngayBatDau).format("DD-MM-YYYY")
        : null),
    ngayKetThuc:
      record.ngayKetThucString ||
      (record.ngayKetThuc
        ? dayjs(record.ngayKetThuc).format("DD-MM-YYYY")
        : null),
    trangThaiId: Number(record.trangThaiId),
    ...overrides,
  });

  const handleUpdateStatus = async () => {
    if (!statusRecord || !nextStatusId) {
      message.warning("Vui lòng chọn trạng thái");
      return;
    }
    try {
      await taskService.update(
        buildPayload(statusRecord, { trangThaiId: nextStatusId }),
      );
      message.success("Cập nhật trạng thái thành công");
      setStatusOpen(false);
      setStatusRecord(null);
      refresh();
    } catch (err) {
      message.error("Cập nhật trạng thái thất bại");
    }
  };

  // ---- Xóa (chỉ "Chờ phê duyệt" hoặc "Từ chối") ----
  const confirmDelete = (record) => {
    Modal.confirm({
      title: "Xác nhận xóa công việc?",
      content: `Mã CV: ${record.maCongViec || ""}`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: () =>
        taskService
          .delete(record.uuid)
          .then(() => {
            message.success("Đã xóa");
            refresh();
          })
          .catch(() => message.error("Xóa thất bại")),
    });
  };

  const productLabel = (record) =>
    record.sanPhamTen ||
    products.find((p) => p.value === Number(record.sanPhamId))?.label ||
    record.sanPhamId ||
    "-";
  const typeLabel = (record) =>
    record.loaiCongViecTen ||
    types.find((t) => t.value === Number(record.loaiCongViecId))?.label ||
    record.loaiCongViecId ||
    "-";
  const statusLabel = (record) =>
    record.trangThaiTen ||
    statuses.find((s) => s.value === Number(record.trangThaiId))?.label ||
    "";

  const columns = [
    {
      title: "STT",
      render: (_, __, index) =>
        index + 1 + (pagination.current - 1) * pagination.pageSize,
      width: 60,
    },
    { title: "Mã CV", dataIndex: "maCongViec", width: 110 },
    {
      title: "Nội dung công việc",
      dataIndex: "noiDungCongViec",
      ellipsis: true,
    },
    {
      title: "Loại công việc",
      dataIndex: "loaiCongViecTen",
      ellipsis: true,
    },
    {
      title: "Sản phẩm",
      render: (_, record) => productLabel(record),
      width: 150,
    },
    {
      title: "Nỗ lực",
      dataIndex: "noLucThucHien",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      width: 140,
      render: (_, record) => {
        const cls = getRecordClass(record);
        return (
          <Tag color={TRANG_THAI_TAG_COLOR[cls]}>
            {statusLabel(record) || "N/A"}
          </Tag>
        );
      },
    },
    { title: "Ngày bắt đầu", dataIndex: "ngayBatDauString", width: 180 },
    { title: "Ngày kết thúc", dataIndex: "ngayKetThucString", width: 180 },
    {
      title: "Thao tác",
      align: "center",
      width: 160,
      fixed: "right",
      render: (_, record) => {
        const cls = getRecordClass(record);
        const canEdit =
          cls === TRANG_THAI.CHO_PHE_DUYET || cls === TRANG_THAI.TU_CHOI;
        const canUpdateStatus = !!(
          NEXT_STATUS_MAP[cls] && NEXT_STATUS_MAP[cls].length
        );
        const canDelete =
          cls === TRANG_THAI.CHO_PHE_DUYET || cls === TRANG_THAI.TU_CHOI;
        return (
          <Space size={0}>
            <Tooltip title="Xem chi tiết">
              <Button
                icon={<EyeOutlined />}
                type="text"
                onClick={() => openDetail(record)}
              />
            </Tooltip>
            {canEdit && (
              <Tooltip
                title={
                  cls === TRANG_THAI.TU_CHOI
                    ? "Sửa & xin duyệt lại"
                    : "Chỉnh sửa"
                }
              >
                <Button
                  icon={<EditOutlined />}
                  type="text"
                  onClick={() => openEdit(record, cls)}
                />
              </Tooltip>
            )}
            {canUpdateStatus && (
              <Tooltip title="Cập nhật trạng thái">
                <Button
                  icon={<SyncOutlined />}
                  type="text"
                  onClick={() => openUpdateStatus(record, cls)}
                />
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title="Xóa">
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  type="text"
                  onClick={() => confirmDelete(record)}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  // Options cho modal cập nhật trạng thái dựa trên trạng thái hiện tại của bản ghi.
  const statusRecordClass = statusRecord ? getRecordClass(statusRecord) : null;
  const nextStatusOptions = (NEXT_STATUS_MAP[statusRecordClass] || []).map(
    (k) => ({
      value: resolveTrangThaiId(statuses, k),
      label: resolveTrangThaiLabel(statuses, k),
    }),
  );

  return (
    <div style={{ padding: "24px", background: "#f5f7f9", minHeight: "100vh" }}>
      <Card
        style={{ marginBottom: "16px" }}
        styles={{ body: { padding: "20px" } }}
      >
        <Form form={filterForm} layout="vertical">
          <Row gutter={[16, 0]}>
            <Col span={6}>
              <Form.Item name="noiDungCongViec" label="Nội dung">
                <Input placeholder="Tìm nội dung..." allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sanPhamId" label="Sản phẩm">
                <Select
                  placeholder="Chọn sản phẩm"
                  options={products}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="trangThaiId" label="Trạng thái">
                <Select
                  placeholder="Chọn trạng thái"
                  options={statuses}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="loaiCongViecId" label="Loại công việc">
                <Select placeholder="Chọn loại CV" options={types} allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="rangeDate" label="Khoảng thời gian">
                <RangePicker format="DD-MM-YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col
              span={16}
              style={{
                display: "flex",
                alignItems: "flex-end",
                paddingBottom: "24px",
              }}
            >
              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleFilter}
                >
                  Tìm kiếm
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    filterForm.resetFields();
                    setCurrentFilters({});
                    fetchData(1, pagination.pageSize, {});
                  }}
                >
                  Làm mới
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        title={<b>Danh sách công việc</b>}
        styles={{ body: { padding: "0px" } }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Thêm mới
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="uuid"
          loading={loading}
          scroll={{ x: "max-content" }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total) => `Tổng cộng ${total} bản ghi`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Modal Thêm / Sửa */}
      <Modal
        title={editingId ? "Cập nhật công việc" : "Thêm mới công việc"}
        open={isFormOpen}
        onOk={handleSaveForm}
        onCancel={() => setIsFormOpen(false)}
        okText={editingClass === TRANG_THAI.TU_CHOI ? "Gửi duyệt lại" : "Lưu"}
        cancelText="Hủy"
        width={700}
        destroyOnHidden
      >
        {editingClass === TRANG_THAI.TU_CHOI && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="Công việc đã bị từ chối. Sau khi lưu, công việc sẽ chuyển về 'Chờ phê duyệt' để xin duyệt lại."
          />
        )}
        {!editingId && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Công việc mới sẽ ở trạng thái 'Chờ phê duyệt' và được gửi tới quản trị viên."
          />
        )}
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item
            name="noiDungCongViec"
            label="Nội dung"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <TextArea rows={3} placeholder="Nhập nội dung công việc..." />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="maCongViec" label="Mã công việc">
                <Input placeholder="Nhập mã..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sanPhamId" label="Sản phẩm">
                <Select
                  options={products}
                  placeholder="Chọn sản phẩm"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="loaiCongViecId" label="Loại công việc">
                <Select options={types} placeholder="Chọn loại" allowClear />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="noLucThucHien" label="Nỗ lực">
                <Input placeholder="Nhập nỗ lực..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ngayBatDau" label="Ngày bắt đầu">
                <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ngayKetThuc" label="Ngày kết thúc">
                <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal Xem chi tiết */}
      <Modal
        title="Chi tiết công việc"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>Đóng</Button>}
        width={700}
      >
        {detailRecord && (
          <Descriptions
            bordered
            column={2}
            size="small"
            styles={{ label: { width: 140 } }}
          >
            <Descriptions.Item label="Mã CV">
              {detailRecord.maCongViec || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={TRANG_THAI_TAG_COLOR[getRecordClass(detailRecord)]}>
                {statusLabel(detailRecord) || "N/A"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Nội dung" span={2}>
              {detailRecord.noiDungCongViec || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Sản phẩm">
              {productLabel(detailRecord)}
            </Descriptions.Item>
            <Descriptions.Item label="Loại công việc">
              {typeLabel(detailRecord)}
            </Descriptions.Item>
            <Descriptions.Item label="Nỗ lực">
              {detailRecord.noLucThucHien || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày bắt đầu">
              {detailRecord.ngayBatDauString ||
                (detailRecord.ngayBatDau
                  ? dayjs(detailRecord.ngayBatDau).format("DD-MM-YYYY")
                  : "-")}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày kết thúc" span={2}>
              {detailRecord.ngayKetThucString ||
                (detailRecord.ngayKetThuc
                  ? dayjs(detailRecord.ngayKetThuc).format("DD-MM-YYYY")
                  : "-")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Modal Cập nhật trạng thái */}
      <Modal
        title="Cập nhật trạng thái"
        open={statusOpen}
        onOk={handleUpdateStatus}
        onCancel={() => setStatusOpen(false)}
        okText="Cập nhật"
        cancelText="Hủy"
        width={520}
      >
        {statusRecord && (
          <Form layout="vertical">
            <Form.Item label="Mã công việc">
              <Input value={statusRecord.maCongViec || ""} disabled />
            </Form.Item>
            <Form.Item label="Trạng thái hiện tại">
              <Input value={statusLabel(statusRecord)} disabled />
            </Form.Item>
            <Form.Item label="Chuyển sang" required>
              <Select
                value={nextStatusId}
                onChange={setNextStatusId}
                options={nextStatusOptions}
                placeholder="Chọn trạng thái tiếp theo"
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default TaskManager;
