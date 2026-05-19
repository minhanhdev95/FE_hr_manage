import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, DatePicker, message, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import taskService from '../services/taskService';
import danhMucService from '../services/danhMucService';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const TaskManager = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  
  // Quản lý phân trang
  const [pagination, setPagination] = useState({ 
    current: 1, 
    pageSize: 10, 
    total: 0 
  });
  
  const [currentFilters, setCurrentFilters] = useState({});
  const [products, setProducts] = useState([]);
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const loadCategories = async () => {
    try {
      const [resProd, resType, resStatus] = await Promise.all([
        danhMucService.findAll(danhMucService.TABLES.SAN_PHAM),
        danhMucService.findAll(danhMucService.TABLES.LOAI_CONG_VIEC),
        danhMucService.findAll(danhMucService.TABLES.TRANG_THAI_CONG_VIEC)
      ]);
      const mapData = (arr) => (arr || []).map(item => ({ 
        value: item.id ? Number(item.id) : item.id, 
        label: String(item.ten || '') 
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
      
      const totalRecords = res.data && res.data.length > 0 ? res.data[0].tongSoBanGhi : 0;
      
      setPagination(prev => ({ 
        ...prev, 
        current: page, 
        pageSize: size,
        total: totalRecords 
      }));
    } catch (error) {
      message.error("Không thể tải danh sách công việc");
    }
    setLoading(false);
  };

  useEffect(() => { 
    loadCategories();
    fetchData(1, 10); 
  }, []);

  const handleTableChange = (newPagination) => {
    fetchData(newPagination.current, newPagination.pageSize, currentFilters);
  };

  const handleFilter = () => {
    const values = filterForm.getFieldsValue();
    const filters = {
      ...values,
      ngayBatDau: values.rangeDate ? values.rangeDate[0].format('DD-MM-YYYY') : null,
      ngayKetThuc: values.rangeDate ? values.rangeDate[1].format('DD-MM-YYYY') : null,
    };
    delete filters.rangeDate;
    setCurrentFilters(filters);
    fetchData(1, pagination.pageSize, filters);
  };

  const showModal = (record = null) => {
    if (record) {
      setEditingId(record.uuid);
      form.setFieldsValue({
        ...record,
        sanPhamId: record.sanPhamId ? Number(record.sanPhamId) : null,
        loaiCongViecId: record.loaiCongViecId ? Number(record.loaiCongViecId) : null,
        trangThaiId: record.trangThaiId ? Number(record.trangThaiId) : null,
        ngayBatDau: record.ngayBatDau ? dayjs(record.ngayBatDau) : null,
        ngayKetThuc: record.ngayKetThuc ? dayjs(record.ngayKetThuc) : null,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        uuid: editingId,
        ngayBatDau: values.ngayBatDau?.format('DD-MM-YYYY'),
        ngayKetThuc: values.ngayKetThuc?.format('DD-MM-YYYY'),
      };

      if (editingId) {
        await taskService.update(payload);
        message.success("Cập nhật thành công");
      } else {
        await taskService.insert(payload);
        message.success("Thêm mới thành công");
      }
      setIsModalOpen(false);
      fetchData(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error("Có lỗi xảy ra khi lưu dữ liệu");
    }
  };

  const columns = [
    { title: 'STT', render: (_, __, index) => index + 1 + (pagination.current - 1) * pagination.pageSize, width: 60 },
    { title: 'Mã CV', dataIndex: 'maCongViec', width: 100 },
    { title: 'Nội dung', dataIndex: 'noiDungCongViec', ellipsis: true },
    { 
      title: 'Sản phẩm', 
      dataIndex: 'sanPhamId', 
      render: (id, record) => record.sanPhamTen || products.find(p => p.value === Number(id))?.label || id
    },
    { 
      title: 'Loại CV', 
      dataIndex: 'loaiCongViecId', 
      render: (id, record) => record.loaiCongViecTen || types.find(t => t.value === Number(id))?.label || id
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'trangThaiId', 
      render: (id, record) => {
        const name = String(record.trangThaiTen || statuses.find(s => s.value === Number(id))?.label || '');
        let color = name.toLowerCase().includes('hoàn thành') ? 'green' : (name.toLowerCase().includes('thực hiện') ? 'blue' : 'orange');
        return <Tag color={color}>{name || 'N/A'}</Tag>
      }
    },
    { title: 'Thao tác', align: 'center', render: (_, record) => (
      <Space>
        <Button icon={<EditOutlined />} onClick={() => showModal(record)} type="text" />
        <Button icon={<DeleteOutlined />} danger type="text" onClick={() => {
            Modal.confirm({ title: 'Xác nhận xóa?', onOk: () => taskService.delete(record.uuid).then(() => fetchData(pagination.current, pagination.pageSize)) });
        }} />
      </Space>
    )},
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f7f9', minHeight: '100vh' }}>
      <Card style={{ marginBottom: '16px' }} styles={{ body: { padding: '20px' } }}>
        <Form form={filterForm} layout="vertical">
          <Row gutter={[16, 0]}>
            <Col span={6}>
              <Form.Item name="noiDungCongViec" label="Nội dung"><Input placeholder="Tìm nội dung..." allowClear /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sanPhamId" label="Sản phẩm"><Select placeholder="Chọn sản phẩm" options={products} allowClear /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="trangThaiId" label="Trạng thái"><Select placeholder="Chọn trạng thái" options={statuses} allowClear /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="loaiCongViecId" label="Loại công việc"><Select placeholder="Chọn loại CV" options={types} allowClear /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="rangeDate" label="Khoảng thời gian"><RangePicker format="DD-MM-YYYY" style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={4} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '24px' }}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleFilter}>Tìm kiếm</Button>
                <Button icon={<ReloadOutlined />} onClick={() => { filterForm.resetFields(); setCurrentFilters({}); fetchData(1, pagination.pageSize, {}); }}>Làm mới</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card 
        title={<b>DANH SÁCH CÔNG VIỆC</b>} 
        styles={{ body: { padding: '0px' } }}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Thêm mới</Button>}
      >
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="uuid" 
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Tổng cộng ${total} bản ghi`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal title={editingId ? "Cập nhật" : "Thêm mới"} open={isModalOpen} onOk={handleSave} onCancel={() => setIsModalOpen(false)} width={700}>
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="noiDungCongViec" label="Nội dung" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="sanPhamId" label="Sản phẩm"><Select options={products} placeholder="Chọn sản phẩm" /></Form.Item></Col>
            <Col span={12}><Form.Item name="maCongViec" label="Mã công việc"><Input placeholder="Nhập mã..." /></Form.Item></Col>
            <Col span={12}><Form.Item name="loaiCongViecId" label="Loại"><Select options={types} placeholder="Chọn loại" /></Form.Item></Col>
            <Col span={12}><Form.Item name="trangThaiId" label="Trạng thái"><Select options={statuses} placeholder="Chọn trạng thái" /></Form.Item></Col>
            <Col span={12}><Form.Item name="ngayBatDau" label="Ngày bắt đầu"><DatePicker format="DD-MM-YYYY" style={{width: '100%'}}/></Form.Item></Col>
            <Col span={12}><Form.Item name="ngayKetThuc" label="Ngày kết thúc"><DatePicker format="DD-MM-YYYY" style={{width: '100%'}}/></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskManager;