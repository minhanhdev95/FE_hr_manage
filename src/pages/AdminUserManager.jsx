import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Input, Button, Table, message, Select } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import adminService from '../services/adminService';
import danhMucService from '../services/danhMucService';
import authService from '../services/authService';

const AdminUserManager = () => {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genders, setGenders] = useState([]);
  const [ethnics, setEthnics] = useState([]);
  const [filterForm] = Form.useForm();

  useEffect(() => {
    if (!authService.isAdmin()) return;
    const load = async () => {
      setLoading(true);
      try {
        const [resUsers, resGenders, resEthnics] = await Promise.all([
          adminService.getDsNhanSuQuanLy(),
          danhMucService.findAll(danhMucService.TABLES.DM_GIOI_TINH),
          danhMucService.findAll(danhMucService.TABLES.DM_DAN_TOC),
        ]);
        const list = (resUsers && resUsers.data) ? resUsers.data : (Array.isArray(resUsers) ? resUsers : []);
        setUsers(list);
        setFiltered(list);
        setGenders(resGenders || []);
        setEthnics(resEthnics || []);
      } catch (err) {
        console.error(err);
        message.error('Lỗi tải danh sách nhân sự hoặc danh mục');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = () => {
    const values = filterForm.getFieldsValue();
    const hoTen = values.hoTen ? String(values.hoTen).trim().toLowerCase() : '';
    const maDinhDanh = values.maDinhDanh ? String(values.maDinhDanh).trim().toLowerCase() : '';
    const email = values.email ? String(values.email).trim().toLowerCase() : '';
    const ghiChu = values.ghiChu ? String(values.ghiChu).trim().toLowerCase() : '';

    const selectedGioiTinhName = values.gioiTinhId ? (genders.find(g => g.id === values.gioiTinhId)?.ten || '') : '';
    const selectedDanTocName = values.danTocId ? (ethnics.find(e => e.id === values.danTocId)?.ten || '') : '';

    const result = users.filter(u => {
      const matchHoTen = hoTen ? (u.hoTen || '').toLowerCase().includes(hoTen) : true;
      const matchMa = maDinhDanh ? (u.maDinhDanh || '').toLowerCase().includes(maDinhDanh) : true;
      const matchEmail = email ? (u.email || '').toLowerCase().includes(email) : true;
      const matchGhiChu = ghiChu ? (u.ghiChu || '').toLowerCase().includes(ghiChu) : true;
      const matchGioiTinh = selectedGioiTinhName ? ((u.gioiTinhTen || '').toLowerCase().includes(selectedGioiTinhName.toLowerCase())) : true;
      const matchDanToc = selectedDanTocName ? ((u.danTocTen || '').toLowerCase().includes(selectedDanTocName.toLowerCase())) : true;
      return matchHoTen && matchMa && matchEmail && matchGhiChu && matchGioiTinh && matchDanToc;
    });
    setFiltered(result);
  };

  const handleReset = () => {
    filterForm.resetFields();
    setFiltered(users);
  };

  if (!authService.isAdmin()) {
    return <div style={{ padding: 24 }}>Bạn không có quyền truy cập trang này.</div>;
  }

  const columns = [
    { title: 'Họ tên', dataIndex: 'hoTen', key: 'hoTen' },
    { title: 'Mã định danh', dataIndex: 'maDinhDanh', key: 'maDinhDanh' },
    { title: 'Giới tính', dataIndex: 'gioiTinh', key: 'gioiTinhTen' },
    { title: 'Dân tộc', dataIndex: 'danToc', key: 'danTocTen' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Username', dataIndex: 'userName', key: 'userName' },
    { title: 'Quyền', dataIndex: 'roleName', key: 'roleName' },
    { title: 'Ghi chú', dataIndex: 'ghiChu', key: 'ghiChu' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={24}>
        <Col span={24}>
          <Card title={<b>Quản lý nhân sự</b>}>
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
                        {(genders || []).map(g => <Select.Option key={g.id} value={g.id}>{g.ten}</Select.Option>)}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item name="danTocId" label="Dân tộc">
                      <Select placeholder="Chọn dân tộc" allowClear>
                        {(ethnics || []).map(e => <Select.Option key={e.id} value={e.id}>{e.ten}</Select.Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 0]}>
                  <Col span={8}>
                    <Form.Item name="email" label="Email">
                      <Input placeholder="Nhập email" allowClear />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="ghiChu" label="Ghi chú">
                      <Input placeholder="Nhập ghi chú" allowClear />
                    </Form.Item>
                  </Col>
                  <Col span={8} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                    <div>
                      <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} style={{ marginRight: 8 }}>
                        Tìm kiếm
                      </Button>
                      <Button icon={<ReloadOutlined />} onClick={handleReset}>
                        Làm mới
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>

            <div style={{ marginTop: 16 }}>
              <Table
                columns={columns}
                dataSource={filtered}
                rowKey={(record) => record.uuid || record.id || record.maDinhDanh}
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminUserManager;
