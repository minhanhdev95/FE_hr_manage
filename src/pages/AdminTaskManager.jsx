import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Checkbox, Table, Button, Tag, Space, Modal, Form, Input, Select, DatePicker, message, Avatar } from 'antd';
import { EditOutlined, UserOutlined, PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';
import adminService from '../services/adminService';
import danhMucService from '../services/danhMucService';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const AdminTaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [isGiaoViecOpen, setIsGiaoViecOpen] = useState(false);
  const [giaoViecForm] = Form.useForm();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editForm] = Form.useForm();
  const [selectedTrangThaiId, setSelectedTrangThaiId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedTask(null);
  };

  const getStatusByNameOrId = (name, fallbackId) => {
    const found = statuses.find(s => s.ten === name || s.id === fallbackId);
    return found ? found.id : fallbackId;
  };

  const handleOpenApproveModal = (task) => {
    setEditTask(task);
    // default to "Đã tiếp nhận" if available
    const acceptedId = getStatusByNameOrId('Đã tiếp nhận', 2);
    setSelectedTrangThaiId(acceptedId);
    editForm.setFieldsValue({ trangThaiId: acceptedId });
    setEditModalOpen(true);
  };

  const handleCloseApproveModal = () => {
    setEditModalOpen(false);
    setEditTask(null);
    setSelectedTrangThaiId(null);
    editForm.resetFields();
  };

  const handleSubmitApprove = async () => {
    if (!editTask) return;
    if (!selectedTrangThaiId) {
      message.warning('Vui lòng chọn trạng thái');
      return;
    }
    setEditLoading(true);
    try {
      await adminService.update({ uuid: editTask.uuid, trangThaiId: selectedTrangThaiId });
      message.success('Cập nhật trạng thái thành công');
      handleCloseApproveModal();
      fetchTasks(pagination.current, pagination.pageSize, selectedUserIds);
    } catch (err) {
      console.error(err);
      message.error('Cập nhật trạng thái thất bại');
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setUserLoading(true);
      try {
        const [resUsers, resProducts, resTypes, resStatuses] = await Promise.all([
          adminService.getNhanSu(),
          danhMucService.findAll(danhMucService.TABLES.SAN_PHAM),
          danhMucService.findAll(danhMucService.TABLES.LOAI_CONG_VIEC),
          danhMucService.findAll(danhMucService.TABLES.TRANG_THAI_CONG_VIEC)
        ]);
        setUsers(resUsers.data || []);
        setProducts(resProducts || []);
        setTypes(resTypes || []);
        setStatuses(resStatuses || []);
      } catch (err) {
        message.error("Lỗi tải dữ liệu");
      } finally {
        setUserLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const [filterForm] = Form.useForm();

  const fetchTasks = async (page = 1, size = 10, userIds = selectedUserIds, filters = {}) => {
    // if no users selected, show empty
    if (userIds.length === 0) {
      setTasks([]);
      setPagination(prev => ({ ...prev, current: 1, total: 0 }));
      return;
    }
    setLoading(true);
    try {
      const payload = { ...filters, nhanSuIds: userIds };
      const res = await adminService.findAll(payload, page - 1, size);
      const taskList = res.data || [];
      setTasks(taskList);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: taskList[0]?.tongSoBanGhi || taskList.length || 0,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // load danh mục LOAI_CONG_VIEC and TRANG_THAI_CONG_VIEC
    const loadTypesAndStatuses = async () => {
      try {
        const [resTypes, resStatuses] = await Promise.all([
          danhMucService.findAll(danhMucService.TABLES.LOAI_CONG_VIEC),
          danhMucService.findAll(danhMucService.TABLES.TRANG_THAI_CONG_VIEC)
        ]);
        setTypes(resTypes || []);
        setStatuses(resStatuses || []);
      } catch (err) {
        // ignore
      }
    };
    loadTypesAndStatuses();
  }, []);

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

  const getStatusTagProps = (statusId) => {
    switch (statusId) {
      case 1:
        return { color: 'default', style: { color: '#8c8c8c' } }; // xám chữ
      case 2:
        return { color: 'yellow' };
      case 3:
        return { color: 'red' };
      case 4:
        return { color: 'blue' };
      case 5:
        return { color: 'green' };
    }
  };

  const columns = [
    { title: 'STT', render: (_, __, index) => index + 1 + (pagination.current - 1) * pagination.pageSize, width: 60 },
    { title: 'Mã CV', dataIndex: 'maCongViec', width: 120 },
    { title: 'Nhân sự', dataIndex: 'nhanSuHoVaTen', width: 200 },
    { title: 'Nội dung công việc', dataIndex: 'noiDungCongViec', ellipsis: true },
    { title: 'Loại công việc', dataIndex: 'loaiCongViecTen', width: 180 },
    { title: 'Sản phẩm', dataIndex: 'sanPhamTen', width: 180 },
    { title: 'Nỗ lực', dataIndex: 'noLucThucHien', width: 100 },
    { title: 'Trạng thái', dataIndex: 'trangThaiTen', render: (t, record) => <Tag {...getStatusTagProps(record.trangThaiId)}>{t}</Tag>, width: 140 },
    { title: 'Ngày bắt đầu', dataIndex: 'ngayBatDauString', width: 180 },
    { title: 'Ngày kết thúc', dataIndex: 'ngayKetThucString', width: 180 },
    { title: 'Thao tác', width: 100, fixed: 'right', render: (_, record) => {
      const isPending = record.trangThaiTen === 'Chờ phê duyệt' || record.trangThaiId === 1;
      return (
        <Space>
          {isPending && <Button icon={<EditOutlined />} type="text" onClick={() => handleOpenApproveModal(record)} />}
          <Button icon={<EyeOutlined />} type="text" onClick={() => handleViewTask(record)} />
        </Space>
      );
    } }
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f7f9', minHeight: '100vh' }}>
      <Row gutter={24}>
        <Col span={4}>
          <Card title={<b>Danh sách nhân sự</b>} style={{ body: { padding: '0px' } }} loading={userLoading}>
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

        <Col span={20}>
          <Card style={{ marginBottom: 16 }}>
            <Form form={filterForm} layout="vertical">
              <Row gutter={[16, 0]}>
                <Col span={6}><Form.Item name="noiDungCongViec" label="Nội dung"><Input placeholder="Tìm nội dung..." allowClear /></Form.Item></Col>
                <Col span={6}><Form.Item name="sanPhamId" label="Sản phẩm"><Select placeholder="Chọn sản phẩm" options={(products||[]).map(p=>({ value: p.id, label: p.ten }))} allowClear /></Form.Item></Col>
                <Col span={6}><Form.Item name="loaiCongViecId" label="Loại CV"><Select placeholder="Chọn loại" options={(types||[]).map(t=>({ value: t.id, label: t.ten }))} allowClear /></Form.Item></Col>
                <Col span={6}><Form.Item name="trangThaiId" label="Trạng thái"><Select placeholder="Chọn trạng thái" options={(statuses||[]).map(s=>({ value: s.id, label: s.ten }))} allowClear /></Form.Item></Col>
                <Col span={12}><Form.Item name="rangeDate" label="Khoảng thời gian"><RangePicker format="DD-MM-YYYY" style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={12} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: '24px' }}>
                  <Space>
                    <Button type="primary" icon={<SearchOutlined />} onClick={() => {
                      if (!selectedUserIds || selectedUserIds.length === 0) {
                        message.warning('Bạn chưa chọn nhân sự nào!');
                        return;
                      }
                      const values = filterForm.getFieldsValue();
                      const filters = {
                        ...values,
                        ngayBatDau: values.rangeDate ? values.rangeDate[0].format('DD-MM-YYYY') : null,
                        ngayKetThuc: values.rangeDate ? values.rangeDate[1].format('DD-MM-YYYY') : null,
                      };
                      delete filters.rangeDate;
                      fetchTasks(1, pagination.pageSize, selectedUserIds, filters);
                    }}>Tìm kiếm</Button>
                    <Button icon={<ReloadOutlined />} onClick={() => { filterForm.resetFields() }}>Làm mới</Button>
                  </Space>
                </Col>
              </Row>
            </Form>
          </Card>

          <Card 
            title={<b>Danh sách công việc</b>}
            extra={<div style={{ display: 'flex', gap: 8 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsGiaoViecOpen(true)}>Giao côngviệc</Button>
            </div>}
          >
            <Table
              columns={columns}
              dataSource={tasks}
              rowKey="uuid"
              loading={loading}
              pagination={{ current: pagination.current, total: pagination.total, onChange: (p) => fetchTasks(p, pagination.pageSize, selectedUserIds) }}
              scroll={{ x: 'max-content', y: '500px' }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={<b>Giao công việc</b>}
        open={isGiaoViecOpen}
        onCancel={() => { setIsGiaoViecOpen(false); giaoViecForm.resetFields(); }}
        footer={null}
        width={700}
      >
        <Form form={giaoViecForm} layout="vertical">
          <Form.Item name="noiDungCongViec" label={<span> Nội dung công việc <span style={{ color: 'red' }}>*</span></span>}>
            <TextArea rows={4} placeholder="Nhập nội dung..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="nhanSuUuid" label={<span> Nhân sự <span style={{ color: 'red' }}>*</span></span>}>
                <Select placeholder="Chọn nhân sự">
                  {users.map(u => <Select.Option key={u.uuid} value={u.uuid}>{u.hoTen}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sanPhamId" label={<span> Sản phẩm <span style={{ color: 'red' }}>*</span></span>}>
                <Select placeholder="Chọn sản phẩm">
                  {products.map(p => <Select.Option key={p.id} value={p.id}>{p.ten}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="ngayBatDau" label={<span> Ngày bắt đầu <span style={{ color: 'red' }}>*</span></span>}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ngayKetThuc" label={<span> Ngày kết thúc <span style={{ color: 'red' }}>*</span></span>}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleGiaoViec(false)}>Giao công việc</Button>
            <Button icon={<CloseOutlined />} onClick={() => { setIsGiaoViecOpen(false); giaoViecForm.resetFields(); }}>Hủy</Button>
          </div>
        </Form>
      </Modal>

        <Modal
          title={<b>Phê duyệt công việc</b>}
          open={editModalOpen}
          onCancel={handleCloseApproveModal}
          footer={[
            <Button key="submit" type="primary" icon={<CheckCircleOutlined />} loading={editLoading} onClick={handleSubmitApprove}>Phê duyệt</Button>,
            <Button key="cancel" icon={<CloseOutlined />} onClick={handleCloseApproveModal}>Đóng</Button>
          ]}
          width={600}
        >
          <Form form={editForm} layout="vertical">
            <Form.Item label="Mã công việc">
              <Input value={editTask?.maCongViec || ''} disabled />
            </Form.Item>
            <Form.Item label="Nhân sự">
              <Input value={editTask?.nhanSuHoVaTen || ''} disabled />
            </Form.Item>
            <Form.Item name="trangThaiId" label="Trạng thái">
              <Select value={selectedTrangThaiId} onChange={(v) => setSelectedTrangThaiId(v)}>
                {(statuses || []).filter(s => s.ten === 'Đã tiếp nhận' || s.ten === 'Từ chối' || s.id === 2 || s.id === 3).map(s => (
                  <Select.Option key={s.id} value={s.id}>{s.ten}</Select.Option>
                ))}
                {/* Fallback options if danhMuc not loaded */}
                {!(statuses || []).some(s => s.id === 2) && <Select.Option value={2}>Đã tiếp nhận</Select.Option>}
                {!(statuses || []).some(s => s.id === 3) && <Select.Option value={3}>Từ chối</Select.Option>}
              </Select>
            </Form.Item>
            <Form.Item label="Nội dung công việc">
              <TextArea rows={3} value={editTask?.noiDungCongViec || ''} disabled />
            </Form.Item>
          </Form>
        </Modal>

      <Modal
        title={<b>Chi tiết công việc</b>}
        open={detailModalOpen}
        onCancel={handleCloseDetailModal}
        footer={<Button onClick={handleCloseDetailModal} icon={<CloseOutlined />}>Đóng</Button>}
        width={700}
      >
        {selectedTask && (
          <Form layout="vertical">
            <Form.Item label="Mã CV">
              <Input value={selectedTask.maCongViec || ''} disabled />
            </Form.Item>
            <Form.Item label="Nhân sự">
              <Input value={selectedTask.nhanSuHoVaTen || ''} disabled />
            </Form.Item>
            <Form.Item label="Nội dung công việc">
              <TextArea rows={4} value={selectedTask.noiDungCongViec || ''} disabled />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Loại công việc">
                  <Input value={selectedTask.loaiCongViecTen || ''} disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Sản phẩm">
                  <Input value={selectedTask.sanPhamTen || ''} disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Nỗ lực">
                  <Input value={selectedTask.noLucThucHien || ''} disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Trạng thái">
                  <Input value={selectedTask.trangThaiTen || ''} disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Ngày bắt đầu">
                  <DatePicker value={selectedTask.ngayBatDauString ? dayjs(selectedTask.ngayBatDauString, 'DD-MM-YYYY') : null} disabled style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Ngày kết thúc">
                  <DatePicker value={selectedTask.ngayKetThucString ? dayjs(selectedTask.ngayKetThucString, 'DD-MM-YYYY') : null} disabled style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Modal>

      <style>{`
        .user-item { padding: 10px 16px; cursor: pointer; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 12px; }
        .user-selected { background: #e6f4ff !important; border-right: 3px solid #1677ff; }
      `}</style>
    </div>
  );
};

export default AdminTaskManager;