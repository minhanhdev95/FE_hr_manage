import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Checkbox, Table, Button, Tag, Space, Modal, Form, Input, Select, DatePicker, message, Avatar } from 'antd';
import { EditOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';
import adminService from '../services/adminService';
import danhMucService from '../services/danhMucService';
import dayjs from 'dayjs';

const { TextArea } = Input;

const AdminTaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [isGiaoViecOpen, setIsGiaoViecOpen] = useState(false);
  const [giaoViecForm] = Form.useForm();

  useEffect(() => {
    const loadInitialData = async () => {
      setUserLoading(true);
      try {
        const [resUsers, resProducts] = await Promise.all([
          adminService.getNhanSu(),
          danhMucService.findAll(danhMucService.TABLES.SAN_PHAM)
        ]);
        setUsers(resUsers.data || []);
        setProducts(resProducts || []);
      } catch (err) {
        message.error("Lỗi tải dữ liệu");
      } finally {
        setUserLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const fetchTasks = async (page = 1, size = 10, userIds = selectedUserIds) => {
    if (userIds.length === 0) { setTasks([]); return; }
    setLoading(true);
    try {
      const res = await adminService.findAll({ nhanSuIds: userIds }, page - 1, size);
      setTasks(res.data || []);
      setPagination(prev => ({ ...prev, current: page, total: res.data[0]?.tongSoBanGhi || 0 }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserIds.length > 0) fetchTasks(1, 10, selectedUserIds);
  }, [selectedUserIds]);

  // HÀM XỬ LÝ GIAO VIỆC - ĐÃ BỎ VALIDATE CHẶN
  const handleGiaoViec = async (isCreateMore = false) => {
    // Lấy dữ liệu trực tiếp từ Form mà không qua Validate để tránh bị chặn
    const values = giaoViecForm.getFieldsValue();
    
    // Kiểm tra thủ công đơn giản
    if (!values.noiDungCongViec || !values.nhanSuUuid || !values.sanPhamId) {
        return message.warning("Vui lòng nhập đủ các trường có dấu (*)");
    }

    const payload = {
      noiDungCongViec: values.noiDungCongViec,
      nhanSuUuid: values.nhanSuUuid,
      sanPhamId: values.sanPhamId,
      ngayBatDau: values.ngayBatDau ? values.ngayBatDau.format('DD-MM-YYYY') : null,
      ngayKetThuc: values.ngayKetThuc ? values.ngayKetThuc.format('DD-MM-YYYY') : null,
      trangThaiId: 1
    };

    console.log(">>> Đang gửi Payload:", payload); // Kiểm tra log này

    try {
      setLoading(true);
      const res = await adminService.insert(payload);
      console.log(">>> Kết quả API:", res);
      
      message.success("Đã giao công việc thành công!");

      if (isCreateMore) {
        giaoViecForm.setFieldsValue({ noiDungCongViec: '' });
      } else {
        setIsGiaoViecOpen(false);
        giaoViecForm.resetFields();
        fetchTasks(pagination.current);
      }
    } catch (err) {
      message.error("Lỗi khi gọi API insert. Kiểm tra Network.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'STT', render: (_, __, index) => index + 1 + (pagination.current - 1) * 10, width: 60 },
    { title: 'Nội dung công việc', dataIndex: 'noiDungCongViec', ellipsis: true },
    { title: 'Trạng thái', dataIndex: 'trangThaiTen', render: (t) => <Tag color="blue">{t}</Tag> },
    { title: 'Sửa', width: 60, render: () => <Button icon={<EditOutlined />} type="text" /> }
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f7f9', minHeight: '100vh' }}>
      <Row gutter={24}>
        <Col span={6}>
          <Card title={<b>Danh sách nhân sự</b>} styles={{ body: { padding: '0px' } }} loading={userLoading}>
             <div style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
              <Checkbox 
                onChange={(e) => setSelectedUserIds(e.target.checked ? users.map(u => u.uuid) : [])}
                checked={selectedUserIds.length === users.length && users.length > 0}
              > Chọn tất cả </Checkbox>
            </div>
            <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {users.map(user => (
                <div 
                  key={user.uuid}
                  className={`user-item ${selectedUserIds.includes(user.uuid) ? 'user-selected' : ''}`}
                  onClick={() => setSelectedUserIds(prev => prev.includes(user.uuid) ? prev.filter(i => i !== user.uuid) : [...prev, user.uuid])}
                >
                  <Checkbox checked={selectedUserIds.includes(user.uuid)} />
                  <Avatar icon={<UserOutlined />} />
                  <div style={{ flex: 1 }}>
                    <div className="user-name">{user.hoTen}</div>
                    <div className="user-sub">{user.maDinhDanh}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col span={18}>
          <Card 
            title={<b>Danh sách công việc</b>}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsGiaoViecOpen(true)}>Giao công việc</Button>}
          >
            <Table columns={columns} dataSource={tasks} rowKey="uuid" loading={loading} pagination={{ current: pagination.current, total: pagination.total, onChange: (p) => fetchTasks(p) }} />
          </Card>
        </Col>
      </Row>

      <Modal
        title={<b>Giao công việc</b>}
        open={isGiaoViecOpen}
        onCancel={() => setIsGiaoViecOpen(false)}
        footer={null}
        width={700}
      >
        <Form form={giaoViecForm} layout="vertical">
          <Form.Item name="noiDungCongViec" label="Nội dung công việc *">
            <TextArea rows={4} placeholder="Nhập nội dung..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="nhanSuUuid" label="Nhân sự *">
                <Select placeholder="Chọn nhân sự">
                  {users.map(u => <Select.Option key={u.uuid} value={u.uuid}>{u.hoTen}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sanPhamId" label="Sản phẩm *">
                <Select placeholder="Chọn sản phẩm">
                  {products.map(p => <Select.Option key={p.id} value={p.id}>{p.ten}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="ngayBatDau" label="Ngày bắt đầu *">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ngayKetThuc" label="Ngày kết thúc *">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <Button onClick={() => setIsGiaoViecOpen(false)}>Hủy</Button>
            <Button onClick={() => handleGiaoViec(true)}>Giao và tạo tiếp</Button>
            <Button type="primary" onClick={() => handleGiaoViec(false)}>Giao việc</Button>
          </div>
        </Form>
      </Modal>

      <style>{`
        .user-item { padding: 10px 16px; cursor: pointer; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 12px; }
        .user-selected { background: #e6f4ff !important; border-right: 3px solid #1677ff; }
      `}</style>
    </div>
  );
};

export default AdminTaskManager;