import React, { useState } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Modal,
  Form,
  Input,
  message,
} from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  BarsOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import authService from "../services/authService";

const { Header, Sider, Content } = Layout;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [changePasswordForm] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = authService.isAdmin();
  const isUser = authService.isUser();

  const menuItems = [
    { key: "/admin-dashboard", icon: <PieChartOutlined />, label: "Tổng quan" }, // màn tổng quan của admin
    {
      key: "/admin-task-manager",
      icon: <TeamOutlined />,
      label: "Quản lý công việc",
    }, // mản quản lý công việc của admin
    {
      key: "/admin-user-manager",
      icon: <UserOutlined />,
      label: "Quản lý nhân sự",
    },
    {
      key: "/admin-category-manager",
      icon: <BarsOutlined />,
      label: "Quản lý danh mục",
    },
    {
      key: "/tien-do-cong-viec",
      icon: <PieChartOutlined />,
      label: "Tiến độ công việc",
    },
    { key: "/tasks", icon: <UserOutlined />, label: "Công việc của tôi" },
    // {
    //   key: "logout",
    //   icon: <LogoutOutlined />,
    //   label: "Đăng xuất",
    //   danger: true,
    //   onClick: () => {
    //     localStorage.removeItem("token");
    //     navigate("/login");
    //   },
    // },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    // hide admin-only routes when not admin
    if (!isAdmin && item.key && item.key.startsWith("/admin-")) return false;
    // show user-only routes only for ROLE_USER
    if ((item.key === "/tasks" || item.key === "/tien-do-cong-viec") && !isUser)
      return false;
    return true;
  });

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#001F3F", padding: "0 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 64,
          }}
        >
          <div
            style={{ color: "white", fontSize: 25, fontWeight: "semi-bold" }}
          >
            HỆ THỐNG QUẢN LÝ CÔNG VIỆC
          </div>
          <div>
            {(() => {
              const items = [
                {
                  key: "profile",
                  label: "Đổi mật khẩu",
                  icon: <KeyOutlined />,
                },
                {
                  key: "logout",
                  label: "Đăng xuất",
                  icon: <LogoutOutlined />,
                  danger: true,
                },
              ];
              const handleMenuClick = ({ key }) => {
                if (key === "logout") {
                  localStorage.removeItem("token");
                  navigate("/login");
                }
                if (key === "profile") {
                  changePasswordForm.resetFields();
                  setChangePasswordVisible(true);
                }
              };

              return (
                <Dropdown
                  menu={{ items, onClick: handleMenuClick }}
                  placement="bottomRight"
                >
                  <div
                    style={{
                      color: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>Xin chào, {authService.getUserName()}</span>
                    <Avatar size="small" icon={<UserOutlined />} />
                  </div>
                </Dropdown>
              );
            })()}
          </div>
        </div>
      </Header>
      <Modal
        title="Đổi mật khẩu"
        open={changePasswordVisible}
        onOk={async () => {
          try {
            const values = await changePasswordForm.validateFields();
            await authService.changePassword({
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
            });
            message.success("Đổi mật khẩu thành công");
            setChangePasswordVisible(false);
            changePasswordForm.resetFields();
          } catch (error) {
            if (error?.errorFields) return;
            message.error(
              error?.response?.data?.message || "Đổi mật khẩu thất bại",
            );
          }
        }}
        onCancel={() => setChangePasswordVisible(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={changePasswordForm} layout="vertical">
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[
              {
                required: true,
                message: "Mật khẩu hiện tại không được để trống",
              },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu hiện tại" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              {
                required: true,
                message: "Mật khẩu mới không được để trống",
              },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={["newPassword"]}
            rules={[
              {
                required: true,
                message: "Vui lòng xác nhận mật khẩu mới",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp"),
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>
        </Form>
      </Modal>
      <Layout>
        <Sider
          theme="dark"
          width={250}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          collapsedWidth={80}
          style={{ background: "#003A6D" }}
        >
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={filteredMenuItems}
            onClick={({ key }) => key !== "logout" && navigate(key)}
            style={{ background: "#003A6D" }}
          />
        </Sider>
        <Layout>
          <Content style={{ margin: "0" }}>{children}</Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
