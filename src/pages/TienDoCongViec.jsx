import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Button, Spin, Empty, message } from 'antd';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import {
  AppstoreOutlined, CheckCircleOutlined, ClockCircleOutlined, SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import taskService from '../services/taskService';
import {
  classifyTrangThai, TRANG_THAI, TRANG_THAI_COLOR, TRANG_THAI_LABEL,
} from '../utils/trangThaiCongViec';

// Định dạng gửi lên BE (đồng bộ với /tong-quan-du-an đang dùng MM-YYYY).
const THOI_GIAN_API_FORMAT = 'MM-YYYY';
// Định dạng hiển thị trên giao diện.
const THOI_GIAN_HIEN_THI = 'MM/YYYY';

// Lấy số đầu tiên hợp lệ trong danh sách giá trị.
const num = (...vals) => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '' && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
};

const asObject = (raw) => (Array.isArray(raw) ? (raw[0] || {}) : (raw || {}));

// Chuẩn hoá nhiều khả năng shape trả về từ API /get-tien-do thành số lượng theo lớp trạng thái.
const buildCounts = (raw) => {
  const counts = {
    [TRANG_THAI.CHO_PHE_DUYET]: 0,
    [TRANG_THAI.DA_TIEP_NHAN]: 0,
    [TRANG_THAI.TU_CHOI]: 0,
    [TRANG_THAI.DANG_THUC_HIEN]: 0,
    [TRANG_THAI.DA_HOAN_THANH]: 0,
  };
  if (!raw) return counts;

  // Shape 1: mảng breakdown [{ trangThaiTen, soLuong }, ...]
  const arr = Array.isArray(raw) ? raw : null;
  const looksLikeBreakdown = arr && arr.length > 0 &&
    (arr[0].trangThaiTen !== undefined || arr[0].ten !== undefined || arr[0].trangThai !== undefined);
  if (looksLikeBreakdown) {
    arr.forEach((r) => {
      const cls = classifyTrangThai(r.trangThaiTen ?? r.ten ?? r.trangThai);
      if (counts[cls] !== undefined) {
        counts[cls] += num(r.soLuong, r.count, r.soLuongCongViec, r.tongSoCongViec, r.value);
      }
    });
    return counts;
  }

  // Shape 2: object tổng hợp (hoặc mảng 1 phần tử tổng hợp).
  const o = asObject(raw);
  counts[TRANG_THAI.DA_HOAN_THANH] = num(o.daHoanThanh, o.hoanThanh, o.soCongViecHoanThanh, o.soDaHoanThanh);
  counts[TRANG_THAI.DANG_THUC_HIEN] = num(o.dangThucHien, o.dangLam, o.soCongViecDangThucHien, o.soDangThucHien);
  counts[TRANG_THAI.DA_TIEP_NHAN] = num(o.daTiepNhan, o.tiepNhan, o.daPheDuyet, o.soCongViecDaTiepNhan, o.soDaTiepNhan);
  counts[TRANG_THAI.CHO_PHE_DUYET] = num(o.choPheDuyet, o.choDuyet, o.soCongViecChoPheDuyet, o.soChoPheDuyet);
  counts[TRANG_THAI.TU_CHOI] = num(o.tuChoi, o.soCongViecTuChoi, o.soTuChoi);
  return counts;
};

const TienDoCongViec = () => {
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [appliedMonth, setAppliedMonth] = useState(dayjs());

  const fetchData = async (month) => {
    setLoading(true);
    try {
      const thoiGian = month.format(THOI_GIAN_API_FORMAT);
      const res = await taskService.getTienDo(thoiGian);
      // Gợi ý debug: kiểm tra shape thực tế của API ở Console nếu cần.
      // console.log('[get-tien-do] response:', res.data);
      setRaw(res.data);
    } catch (e) {
      message.error('Không thể tải dữ liệu tiến độ công việc');
      setRaw(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(appliedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setAppliedMonth(selectedMonth);
    fetchData(selectedMonth);
  };

  const counts = useMemo(() => buildCounts(raw), [raw]);

  const total = useMemo(() => {
    const o = asObject(raw);
    const explicit = num(o.tongCongViec, o.tongSoCongViec, o.tong, o.tongSo);
    return explicit || Object.values(counts).reduce((a, b) => a + b, 0);
  }, [raw, counts]);

  const completed = useMemo(() => {
    const o = asObject(raw);
    return num(o.daHoanThanh, o.hoanThanh, o.soCongViecHoanThanh) || counts[TRANG_THAI.DA_HOAN_THANH];
  }, [raw, counts]);

  const notCompleted = useMemo(() => {
    const o = asObject(raw);
    const explicit = num(o.chuaHoanThanh, o.soChuaHoanThanh, o.soCongViecChuaHoanThanh);
    return explicit || Math.max(total - completed, 0);
  }, [raw, total, completed]);

  // Dữ liệu cho biểu đồ donut (chỉ lấy các trạng thái có số lượng > 0).
  const pieData = useMemo(() => {
    const order = [
      TRANG_THAI.DA_HOAN_THANH,
      TRANG_THAI.DANG_THUC_HIEN,
      TRANG_THAI.DA_TIEP_NHAN,
      TRANG_THAI.CHO_PHE_DUYET,
      TRANG_THAI.TU_CHOI,
    ];
    return order
      .map((k) => ({ key: k, name: TRANG_THAI_LABEL[k], value: counts[k] || 0, color: TRANG_THAI_COLOR[k] }))
      .filter((d) => d.value > 0);
  }, [counts]);

  const hasChartData = pieData.length > 0;

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
    return (
      <div style={{ background: '#fff', border: '1px solid #eee', padding: '6px 10px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: item.color, marginRight: 6 }} />
        <b>{item.name}</b>: {item.value} ({percent}%)
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', background: '#f5f7f9', minHeight: '100vh' }}>
      {/* Tiêu đề + bộ chọn tháng */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Tiến độ công việc</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <DatePicker
            picker="month"
            format={THOI_GIAN_HIEN_THI}
            value={selectedMonth}
            allowClear={false}
            onChange={(date) => setSelectedMonth(date || dayjs())}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>Tìm kiếm</Button>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* 3 thẻ thống kê */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card variant="borderless">
              <Statistic title="Tổng công việc" value={total} prefix={<AppstoreOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card variant="borderless">
              <Statistic title="Công việc đã hoàn thành" value={completed} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card variant="borderless">
              <Statistic title="Công việc chưa hoàn thành" value={notCompleted} valueStyle={{ color: '#cf1322' }} prefix={<ClockCircleOutlined />} />
            </Card>
          </Col>
        </Row>

        {/* Biểu đồ tiến độ (donut) */}
        <Row justify="end">
          <Col xs={24} md={14} lg={12}>
            <Card title={<b>Tiến độ công việc</b>} variant="borderless">
              {hasChartData ? (
                <>
                  <div style={{ position: 'relative', width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.key} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={renderTooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Nhãn tháng ở giữa donut */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <span style={{ fontSize: 26, fontWeight: 700, color: '#333' }}>
                        {appliedMonth.format(THOI_GIAN_HIEN_THI)}
                      </span>
                    </div>
                  </div>

                  {/* Chú thích (legend) tuỳ chỉnh kèm số lượng */}
                  <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                    {pieData.map((d) => (
                      <span key={d.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                        <span style={{ color: '#595959' }}>{d.name}</span>
                        <b>{d.value}</b>
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <Empty description="Không có dữ liệu công việc trong tháng" style={{ padding: '48px 0' }} />
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default TienDoCongViec;
