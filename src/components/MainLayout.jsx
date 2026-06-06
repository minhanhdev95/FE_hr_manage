import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { PieChartOutlined, TeamOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import authService from '../services/authService';

const { Sider, Content } = Layout;

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
    const isAdmin = authService.isAdmin();
    const isUser = authService.isUser();

  const menuItems = [
    { key: '/admin-dashboard', icon: <PieChartOutlined />, label: 'Tổng quan' }, // màn tổng quan của admin
      { key: '/admin-task-manager', icon: <TeamOutlined />, label: 'Quản lý công việc' }, // mản quản lý công việc của admin
    { key: '/tasks', icon: <UserOutlined />, label: 'Công việc của tôi' },
    { 
      key: 'logout', 
      icon: <LogoutOutlined />, 
      label: 'Đăng xuất', 
      danger: true,
      onClick: () => {
        localStorage.removeItem('token');
        navigate('/login');
      }
    },
  ];

    const filteredMenuItems = menuItems.filter(item => {
      // hide admin-only routes when not admin
      if (!isAdmin && item.key && item.key.startsWith('/admin-')) return false;
      // show /tasks only for ROLE_USER
      if (item.key === '/tasks' && !isUser) return false;
      return true;
    });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={250} style={{ background: '#002140' }}>
        <div style={{ height: 64, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>
          HỆ THỐNG QUẢN LÝ
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={filteredMenuItems}
          onClick={({ key }) => key !== 'logout' && navigate(key)}
          style={{ background: '#002140' }}
        />
      </Sider>
      <Layout>
        <Content style={{ margin: '0' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;