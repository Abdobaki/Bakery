import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const mockChartData = [
  { date: '08-01', revenue: 45000, expenses: 12000, net: 33000 },
  { date: '08-02', revenue: 48000, expenses: 14000, net: 34000 },
  { date: '08-03', revenue: 52000, expenses: 11000, net: 41000 },
  { date: '08-04', revenue: 43000, expenses: 15000, net: 28000 },
  { date: '08-05', revenue: 56000, expenses: 13000, net: 43000 },
  { date: '08-06', revenue: 61000, expenses: 16000, net: 45000 },
  { date: '08-07', revenue: 59000, expenses: 14500, net: 44500 }
];

export default function DashboardPage() {
  return (
    <div>
      {/* KPI Overview Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">مداخيل اليوم الإجمالية</div>
          <div className="kpi-value">59,000.00 د.ج</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">المصاريف التشغيلية ومستحقات العمال</div>
          <div className="kpi-value danger">14,500.00 د.ج</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">الصافي التجاري المستحق (Net Profit)</div>
          <div className="kpi-value success">44,500.00 د.ج</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">فروق الصندوق (الأقاس)</div>
          <div className="kpi-value success">0.00 د.ج (مطابق)</div>
        </div>
      </div>

      {/* Financial Trends Recharts Area Chart */}
      <div className="table-container">
        <h2 className="table-title">مؤشر المداخيل والصافي اليومي (د.ج)</h2>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <AreaChart data={mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="revenue" name="المداخيل الإجمالية" stroke="#d97706" fill="#d97706" fillOpacity={0.2} />
              <Area type="monotone" dataKey="net" name="الصافي" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Shifts Status Table */}
      <div className="table-container">
        <h2 className="table-title">حالة ورديات اليوم</h2>
        <table>
          <thead>
            <tr>
              <th>رقم الوردية</th>
              <th>الوردية</th>
              <th>الكاسي المسؤول</th>
              <th>الحالة</th>
              <th>المداخيل</th>
              <th>المصاريف</th>
              <th>الصافي المستحق</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#101</td>
              <td>الوردية الصباحية</td>
              <td>أحمد</td>
              <td><span className="badge badge-closed">مغلقة</span></td>
              <td>32,500.00 د.ج</td>
              <td>8,000.00 د.ج</td>
              <td><strong>24,500.00 د.ج</strong></td>
            </tr>
            <tr>
              <td>#102</td>
              <td>الوردية المسائية</td>
              <td>محمد</td>
              <td><span className="badge badge-open">مفتوحة حالياً</span></td>
              <td>26,500.00 د.ج</td>
              <td>6,500.00 د.ج</td>
              <td><strong>20,000.00 د.ج</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
