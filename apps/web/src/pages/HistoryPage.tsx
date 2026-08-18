import React from 'react';

export default function HistoryPage() {
  return (
    <div>
      <div className="table-container">
        <h2 className="table-title">سجل التقارير اليومية والأرشيف التاريخي (18 شهراً)</h2>

        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الورديات المُغلقة</th>
              <th>إجمالي مداخيل الخبز</th>
              <th>إجمالي المنتجات الخارجية</th>
              <th>إجمالي المصاريف والعمال</th>
              <th>الصافي النهائي</th>
              <th>تقرير PDF</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>2026-08-12</strong></td>
              <td>صباحية + مسائية</td>
              <td>38,500.00 د.ج</td>
              <td>12,500.00 د.ج</td>
              <td>6,500.00 د.ج</td>
              <td><strong style={{ color: '#22c55e' }}>44,500.00 د.ج</strong></td>
              <td><button className="btn">تحميل التقرير 📄</button></td>
            </tr>
            <tr>
              <td><strong>2026-08-11</strong></td>
              <td>صباحية + مسائية</td>
              <td>41,000.00 د.ج</td>
              <td>14,000.00 د.ج</td>
              <td>7,200.00 د.ج</td>
              <td><strong style={{ color: '#22c55e' }}>47,800.00 د.ج</strong></td>
              <td><button className="btn">تحميل التقرير 📄</button></td>
            </tr>
            <tr>
              <td><strong>2026-08-10</strong></td>
              <td>صباحية + مسائية</td>
              <td>36,000.00 د.ج</td>
              <td>11,000.00 د.ج</td>
              <td>5,800.00 د.ج</td>
              <td><strong style={{ color: '#22c55e' }}>41,200.00 د.ج</strong></td>
              <td><button className="btn">تحميل التقرير 📄</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
