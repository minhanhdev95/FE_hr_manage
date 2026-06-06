import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import các Trang (Pages)
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/AdminDashboardPage';
import AdminTaskManager from './pages/AdminTaskManager';
import AdminUserManager from './pages/AdminUserManager';
import TaskManager from './pages/TaskManager';
import NotFoundPage from './pages/NotFoundPage';

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
        {/* Login page */}
        <Route path="/login" element={<LoginPage />} />
        {/* Admin dashboard */}
        <Route 
          path="/admin-dashboard" 
          element={
            <PrivateRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </PrivateRoute>
          } 
        />
        {/* Admin task manager */}
        <Route 
          path="/admin-task-manager" 
          element={
            <PrivateRoute>
              <MainLayout>
                <AdminTaskManager />
              </MainLayout>
            </PrivateRoute>
          } 
        />
        {/* Admin user manager */}
        <Route 
          path="/admin-user-manager" 
          element={
            <PrivateRoute>
              <MainLayout>
                <AdminUserManager />
              </MainLayout>
            </PrivateRoute>
          } 
        />
        {/* Trang Công việc cá nhân cho user */}
        <Route 
          path="/user-dashboard" 
          element={
            <PrivateRoute>
              <MainLayout>
                <TaskManager />
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

        {/* 3. Điều hướng mặc định: Nếu vào trang chủ "/" thì đẩy sang Admin Dashboard */}
        {/* <Route path="/" element={<Navigate to="/admin-dashboard" />} /> */}

        {/* 4. Xử lý trang không tồn tại (404) */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;