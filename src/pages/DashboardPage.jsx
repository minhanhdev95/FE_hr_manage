import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Statistic, DatePicker, Spin, message } from 'antd';
// Sử dụng các component BarChart của recharts
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { AppstoreOutlined, CheckCircleOutlined, SyncOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import adminService from '../services/adminService';
import dayjs from 'dayjs';

const DashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  
  // Giữ nguyên định dạng thời gian chuẩn MM-yyyy
  const [thoiGian, setThoiGian] = useState(dayjs().format('MM-YYYY'));
  const [selectedThoiGian, setSelectedThoiGian] = useState(dayjs().format('MM-YYYY'));

  const fetchStats = async (monthStr) => {
    setLoading(true);
    try {
      const res = await adminService.tongquan(monthStr);
      setData(res.data || []);
    } catch (error) {
      message.error("Không thể lấy dữ liệu tổng quan");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats(thoiGian);
  }, [thoiGian]);

  const handleSearch = () => {
    if (selectedThoiGian !== thoiGian) {
      setThoiGian(selectedThoiGian);
    } else {
      fetchStats(selectedThoiGian);
    }
  };

  // Logic tính toán summary cho các Card vẫn giữ nguyên (tổng tuyệt đối)
  const summary = data.reduce((acc, curr) => ({
    tongCV: acc.tongCV + (curr.tongSoCongViec || 0),
    hoanThanh: acc.hoanThanh + (curr.daHoanThanh || 0),
    dangLam: acc.dangLam + (curr.dangThucHien || 0),
    tongNS: curr.tongSoNhanSu || acc.tongNS
  }), { tongCV: 0, hoanThanh: 0, dangLam: 0, tongNS: 0 });

  // --- PHẦN THAY ĐỔI CHÍNH LÀ Ở ĐÂY ---
  // Format dữ liệu cho biểu đồ: Tính toán tỷ lệ % hoàn thành
  const chartData = data.map(item => {
    const totalCV = item.tongSoCongViec || 0;
    const completedCV = item.daHoanThanh || 0;
    
    // Tính toán % tỉ lệ (tránh chia cho 0)
    const ratioPercent = totalCV > 0 ? (completedCV / totalCV) * 100 : 0;

    return {
      name: item.tenNhanSu,
      // ratioPercent: Sẽ dùng để quyết định độ dài thanh màu đỏ (từ 0 -> 100)
      ratioPercent: ratioPercent, 
      // completedCV: Giá trị tuyệt đối để hiển thị trong Tooltip nếu cần
      completedCV: completedCV,
      totalCV: totalCV,
      // label: Chuỗi hiển thị bên phải thanh Bar (Dạng X/Y)
      label: `${completedCV}/${totalCV}` 
    };
  });

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Hệ thống quản lý công việc</h2>
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <DatePicker 
            picker="month" 
            format="MM-YYYY" 
            allowClear={false}
            value={dayjs(selectedThoiGian, 'MM-YYYY')}
            defaultPickerValue={dayjs()}
            // Khi đổi tháng, chỉ cập nhật giá trị chọn. Chỉ bấm nút Tìm kiếm mới gọi API.
            onChange={(date) => setSelectedThoiGian(date ? date.format('MM-YYYY') : dayjs().format('MM-YYYY'))}
            dateRender={(current) => {
              const isCurrentMonth = current.isSame(dayjs(), 'month');
              return (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                    backgroundColor: isCurrentMonth ? '#e6f7ff' : undefined,
                    color: isCurrentMonth ? '#1890ff' : undefined,
                  }}
                >
                  {current.format('MM')}
                </div>
              );
            }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            Tìm kiếm
          </Button>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* Row 1: Tổng quan Card (Giữ nguyên) */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic title="Tổng công việc" value={summary.tongCV} prefix={<AppstoreOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic title="Công việc đã hoàn thành" value={summary.hoanThanh} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic title="Công việc đang thực hiện" value={summary.dangLam} valueStyle={{ color: '#1890ff' }} prefix={<SyncOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered={false}>
              <Statistic title="Nhân sự đang quản lý" value={summary.tongNS} prefix={<UserOutlined />} />
            </Card>
          </Col>
        </Row>

        {/* Row 2: Biểu đồ hiệu suất (Cập nhật logic hiển thị) */}
        <Card title="Hiệu suất công việc nhân sự" bordered={false}>
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <BarChart
                layout="vertical" // Biểu đồ thanh ngang
                data={chartData}
                margin={{ top: 5, right: 60, left: 40, bottom: 5 }} // Tăng right margin để label không bị mất
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                
                {/* XAxis: Bây giờ đại diện cho % (0-100) */}
                <XAxis 
                  type="number" 
                  domain={[0, 100]} // Cố định domain từ 0% đến 100%
                  hide // Ẩn trục X đi cho giống ảnh mẫu
                />
                
                {/* YAxis: Hiển thị tên nhân sự */}
                <YAxis dataKey="name" type="category" width={120} />
                
                {/* Tooltip khi hover: Có thể tùy chỉnh để hiện cả % và số tuyệt đối */}
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value.toFixed(1)}% (${props.payload.completedCV}/${props.payload.totalCV} CV)`, 
                    "Hiệu suất"
                  ]}
                />
                
                {/* Bar màu đỏ: Độ dài dựa trên dataKey="ratioPercent" */}
                <Bar 
                  dataKey="ratioPercent" // Sử dụng giá trị % đã tính toán
                  fill="#e74c3c" // Màu đỏ
                  barSize={30} 
                  radius={[0, 4, 4, 0]} // Bo góc bên phải
                >
                  {/* LabelList: Hiển thị chuỗi dạng "X/Y" ở bên phải thanh Bar */}
                  <LabelList 
                    dataKey="label" // Sử dụng dataKey="label" chứa chuỗi "12/15"
                    position="right" 
                    style={{ fill: '#666', fontSize: 12 }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend giả lập tỉ lệ % ở dưới cùng cho người dùng dễ hình dung */}
          <div style={{ width: 'calc(100% - 220px)', margin: '10px 0 0 160px', position: 'relative', display: 'flex', alignItems: 'center', height: 28 }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid #999', transform: 'translateY(-50%)' }} />
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', color: '#999', fontSize: '12px' }}>
              <span style={{ background: '#fff', padding: '0 4px', lineHeight: '1' }}>0%</span>
              <span style={{ background: '#fff', padding: '0 4px', lineHeight: '1' }}>10%</span>
              <span style={{ background: '#fff', padding: '0 4px', lineHeight: '1' }}>20%</span>
              <span style={{ background: '#fff', padding: '0 4px', lineHeight: '1' }}>30%</span>
              <span style={{ background: '#fff', padding: '0 4px', lineHeight: '1' }}>40%</span>
              <span style={{ background: '#fff', padding: '0 4px', lineHeight: '1' }}>50%</span>
              <span style={{ background: '#fff', padding: '0 4px', lineHeight: '1' }}>60%</span>
              <span style={{ background: '#fff', padding: '0 4px', lineHeight: '1' }}>70%</span>
              <span style={{ background: '#fff', padding: '0 4px', lineHeight: '1' }}>80%</span>
              <span style={{ background: '#fff', padding: '0 4px', lineHeight: '1' }}>90%</span>
              <span style={{ background: '#fff', padding: '0 4px', lineHeight: '1' }}>100%</span>
            </div>
          </div>
        </Card>
      </Spin>
    </div>
  );
};

export default DashboardPage;