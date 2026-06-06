import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Result, Button } from 'antd';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: 24 }}>
      <Result
        status="404"
        title="404"
        subTitle="Trang bạn đang truy cập không tồn tại."
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            Quay về Dashboard
          </Button>
        }
      />
    </div>
  );
};

export default NotFoundPage;
