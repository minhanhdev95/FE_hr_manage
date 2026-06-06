import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { PieChartOutlined, TeamOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/admin-dashboard', icon: <PieChartOutlined />, label: 'Tổng quan' }, // màn tổng quan của admin
    { key: '/admin-tasks', icon: <TeamOutlined />, label: 'Quản lý công việc' }, // mản quản lý công việc của admin
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
          items={menuItems}
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