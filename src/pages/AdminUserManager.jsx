import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Table,
  message,
  Select,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import adminService from "../services/adminService";
import danhMucService from "../services/danhMucService";
import authService from "../services/authService";

const AdminUserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genders, setGenders] = useState([]);
  const [ethnics, setEthnics] = useState([]);
  const [filterForm] = Form.useForm();

  const loadUsers = async (params = {}) => {
    setLoading(true);
    try {
      const [resUsers, resGenders, resEthnics] = await Promise.all([
        adminService.searchNhanSu(params),
        danhMucService.findAll(danhMucService.TABLES.DM_GIOI_TINH),
        danhMucService.findAll(danhMucService.TABLES.DM_DAN_TOC),
      ]);
      const list =
        resUsers && resUsers.data
          ? resUsers.data
          : Array.isArray(resUsers)
            ? resUsers
            : [];
      setUsers(list);
      setGenders(resGenders || []);
      setEthnics(resEthnics || []);
    } catch (err) {
      console.error(err);
      message.error("Lỗi tải danh sách nhân sự hoặc danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authService.isAdmin()) return;
    loadUsers();
  }, []);

  const handleSearch = async () => {
    const values = filterForm.getFieldsValue();
    const params = Object.fromEntries(
      Object.entries({
        hoTen: values.hoTen,
        maDinhDanh: values.maDinhDanh,
        gioiTinhId: values.gioiTinhId,
        danTocId: values.danTocId,
        email: values.email,
        ghiChu: values.ghiChu,
      }).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    );

    try {
      setLoading(true);
      const res = await adminService.searchNhanSu(params);
      const list = res && res.data ? res.data : Array.isArray(res) ? res : [];
      setUsers(list);
    } catch (err) {
      console.error(err);
      message.error("Lỗi tìm kiếm nhân sự");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    filterForm.resetFields();
  };

  if (!authService.isAdmin()) {
    return (
      <div style={{ padding: 24 }}>Bạn không có quyền truy cập trang này.</div>
    );
  }

  const columns = [
    { title: "Họ tên", dataIndex: "hoTen", key: "hoTen" },
    { title: "Mã định danh", dataIndex: "maDinhDanh", key: "maDinhDanh" },
    { title: "Giới tính", dataIndex: "gioiTinh", key: "gioiTinhTen" },
    { title: "Dân tộc", dataIndex: "danToc", key: "danTocTen" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Username", dataIndex: "userName", key: "userName" },
    { title: "Quyền", dataIndex: "roleName", key: "roleName" },
    { title: "Ghi chú", dataIndex: "ghiChu", key: "ghiChu" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={24}>
        <Col span={24}>
          <Card style={{ marginBottom: 16 }}>
            <Form form={filterForm} layout="vertical">
              <Row gutter={[16, 0]}>
                <Col span={6}>
                  <Form.Item name="hoTen" label="Họ tên">
                    <Input placeholder="Nhập họ tên" allowClear />
                  </Form.Item>
                </Col>

                <Col span={6}>
                  <Form.Item name="maDinhDanh" label="Mã định danh">
                    <Input placeholder="Nhập mã định danh" allowClear />
                  </Form.Item>
                </Col>

                <Col span={6}>
                  <Form.Item name="gioiTinhId" label="Giới tính">
                    <Select placeholder="Chọn giới tính" allowClear>
                      {(genders || []).map((g) => (
                        <Select.Option key={g.id} value={g.id}>
                          {g.ten}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={6}>
                  <Form.Item name="danTocId" label="Dân tộc">
                    <Select placeholder="Chọn dân tộc" allowClear>
                      {(ethnics || []).map((e) => (
                        <Select.Option key={e.id} value={e.id}>
                          {e.ten}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col span={6}>
                  <Form.Item name="email" label="Email">
                    <Input placeholder="Nhập email" allowClear />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="ghiChu" label="Ghi chú">
                    <Input placeholder="Nhập ghi chú" allowClear />
                  </Form.Item>
                </Col>
                <Col
                  span={12}
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                    paddingBottom: "24px",
                  }}
                >
                  <div>
                    <Button
                      type="primary"
                      htmlType="button"
                      icon={<SearchOutlined />}
                      onClick={handleSearch}
                      style={{ marginRight: 8 }}
                    >
                      Tìm kiếm
                    </Button>
                    <Button
                      htmlType="button"
                      icon={<ReloadOutlined />}
                      onClick={handleReset}
                    >
                      Làm mới
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Card>
          <Card
            title={<b>Danh sách nhân sự</b>}
            extra={
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsGiaoViecOpen(true)}
                >
                  Thêm nhân sự
                </Button>
              </div>
            }
          >
            <Table
              columns={columns}
              dataSource={users}
              rowKey={(record) => record.uuid || record.id || record.maDinhDanh}
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminUserManager;
