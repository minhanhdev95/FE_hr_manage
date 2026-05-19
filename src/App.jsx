import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import các Trang (Pages)
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminTaskManager from './pages/AdminTaskManager';
import TaskManager from './pages/TaskManager';

// Import Bố cục chung (Layout)
import MainLayout from './components/MainLayout';

/**
 * Component bảo vệ đường dẫn
 * Nếu không có token trong localStorage, tự động sút về trang login
 */
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. Trang Login: Không có Sidebar */}
        <Route path="/login" element={<LoginPage />} />

        {/* 2. Các trang nghiệp vụ: Cần Login và có Sidebar (MainLayout) */}
        
        {/* Trang Tổng quan (Biểu đồ) */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </PrivateRoute>
          } 
        />

        {/* Trang Quản lý công việc nhân sự (Dành cho Admin) */}
        <Route 
          path="/admin/tasks" 
          element={
            <PrivateRoute>
              <MainLayout>
                <AdminTaskManager />
              </MainLayout>
            </PrivateRoute>
          } 
        />

        {/* Trang Công việc cá nhân */}
        <Route 
          path="/tasks" 
          element={
            <PrivateRoute>
              <MainLayout>
                <TaskManager />
              </MainLayout>
            </PrivateRoute>
          } 
        />

        {/* 3. Điều hướng mặc định: Nếu vào trang chủ "/" thì đẩy sang Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* 4. Xử lý trang không tồn tại (404) - Tùy chọn */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;