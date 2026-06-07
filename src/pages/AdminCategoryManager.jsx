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
  Tabs,
  Modal,
  Space,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import danhMucService from "../services/danhMucService";
import authService from "../services/authService";

const AdminCategoryManager = () => {
  const [activeTab, setActiveTab] = useState("DM_GIOI_TINH");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  const categoryTables = {
    DM_GIOI_TINH: "Giới tính",
    DM_DAN_TOC: "Dân tộc",
    LOAI_CONG_VIEC: "Loại công việc",
    TRANG_THAI_CONG_VIEC: "Trạng thái công việc",
    SAN_PHAM: "Sản phẩm",
  };

  const loadCategories = async (tableName) => {
    setLoading(true);
    try {
      const data = await danhMucService.findAll(tableName);
      setCategories(data || []);
    } catch (err) {
      console.error(err);
      message.error("Lỗi tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authService.isAdmin()) return;
    loadCategories(activeTab);
  }, [activeTab]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue({
        ten: item.ten,
        moTa: item.moTa || "",
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        const payload = {
          id: editingItem.id,
          ten: values.ten,
          moTa: values.moTa,
        };
        await danhMucService.capNhatDanhMuc(payload, activeTab);
        message.success("Cập nhật danh mục thành công");
      } else {
        const payload = {
          ten: values.ten,
          moTa: values.moTa,
        };
        await danhMucService.themMoiDanhMuc(payload, activeTab);
        message.success("Thêm danh mục thành công");
      }
      handleCloseModal();
      loadCategories(activeTab);
    } catch (err) {
      console.error(err);
      message.error("Lỗi lưu danh mục");
    }
  };

  const handleDelete = (item) => {
    Modal.confirm({
      title: "Xóa danh mục",
      content: `Bạn có chắc muốn xóa danh mục "${item.ten}"?`,
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await danhMucService.xoaDanhMuc(item.id, activeTab);
          message.success("Xóa danh mục thành công");
          loadCategories(activeTab);
        } catch (err) {
          console.error(err);
          message.error("Lỗi xóa danh mục");
        }
      },
    });
  };

  if (!authService.isAdmin()) {
    return (
      <div style={{ padding: 24 }}>Bạn không có quyền truy cập trang này.</div>
    );
  }

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Tên",
      dataIndex: "ten",
      key: "ten",
    },
    {
      title: "Mô tả",
      dataIndex: "moTa",
      key: "moTa",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            // type="primary"
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          ></Button>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          ></Button>
        </Space>
      ),
    },
  ];

  const tabItems = Object.entries(categoryTables).map(([key, label]) => ({
    label: label,
    key: key,
    children: (
      <Card
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Thêm
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={categories}
          rowKey={(record) => record.id}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    ),
  }));

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={24}>
        <Col span={24}>
          <Card title={<b>Quản lý danh mục</b>}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingItem ? "Cập nhật danh mục" : "Thêm danh mục"}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={handleCloseModal}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="ten"
            label="Tên danh mục"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục!" }]}
          >
            <Input placeholder="Nhập tên danh mục" />
          </Form.Item>

          <Form.Item name="moTa" label="Mô tả">
            <Input.TextArea placeholder="Nhập mô tả danh mục" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminCategoryManager;
