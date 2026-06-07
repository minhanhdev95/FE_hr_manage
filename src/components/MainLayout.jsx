import React, { useState } from "react";
import { Layout, Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import authService from "../services/authService";

const { Header, Sider, Content } = Layout;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
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
    { key: "/tien-do-cong-viec", icon: <PieChartOutlined />, label: "Tiến độ công việc" },
    { key: "/tasks", icon: <UserOutlined />, label: "Công việc của tôi" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
      onClick: () => {
        localStorage.removeItem("token");
        navigate("/login");
      },
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    // hide admin-only routes when not admin
    if (!isAdmin && item.key && item.key.startsWith("/admin-")) return false;
    // show user-only routes only for ROLE_USER
    if (
      (item.key === "/tasks" || item.key === "/tien-do-cong-viec") &&
      !isUser
    )
      return false;
    return true;
  });

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#003A6D", padding: "0 24px" }}>
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
            HỆ THỐNG QUẢN LÝ NHÂN SỰ
          </div>
          <div style={{ color: "white" }}>
            Xin chào, {authService.getUserName()}
          </div>
        </div>
      </Header>
      <Layout>
        <Sider
          theme="dark"
          width={250}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          collapsedWidth={80}
          style={{ background: "#001F3F" }}
        >
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={filteredMenuItems}
            onClick={({ key }) => key !== "logout" && navigate(key)}
            style={{ background: "#001F3F" }}
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
