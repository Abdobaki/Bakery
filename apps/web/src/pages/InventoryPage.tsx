import React from 'react';

export default function InventoryPage() {
  return (
    <div>
      <div className="table-container">
        <h2 className="table-title">متابعة مخزون المنتجات الخارجية المنقولة بين الورديات (§11 & §12)</h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '14px' }}>
          معادلة المخزون: <strong>المخزون المتبقي = المخزون الافتتاحي + البضاعة المُستلمة - البضاعة المباعة</strong>.
          المنتجات المتبقية لا تُحسب كمداخيل ولا تُحسب كخسارة، بل تنتقل آلياً كـ "مخزون افتتاحي" للوردية القادمة.
        </p>

        <table>
          <thead>
            <tr>
              <th>المنتج</th>
              <th>سعر الشراء</th>
              <th>سعر البيع</th>
              <th>مخزون البداية</th>
              <th>مستلم (+مخزون)</th>
              <th>مباع (-مخزون)</th>
              <th>المتبقي (ينتقل آلياً)</th>
              <th>الأرباح الصافية</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>كسرة (Kesra)</strong></td>
              <td>35.00 د.ج</td>
              <td>50.00 د.ج</td>
              <td>8 قطع</td>
              <td>10 قطع</td>
              <td>15 قطعة</td>
              <td><strong style={{ color: '#f59e0b', fontSize: '16px' }}>3 قطع</strong></td>
              <td style={{ color: '#22c55e', fontWeight: 'bold' }}>+ 225.00 د.ج</td>
            </tr>
            <tr>
              <td><strong>بيتزا كاري (Pizza carré)</strong></td>
              <td>40.00 د.ج</td>
              <td>60.00 د.ج</td>
              <td>0 قطعة</td>
              <td>25 قطعة</td>
              <td>20 قطعة</td>
              <td><strong style={{ color: '#f59e0b', fontSize: '16px' }}>5 قطع</strong></td>
              <td style={{ color: '#22c55e', fontWeight: 'bold' }}>+ 400.00 د.ج</td>
            </tr>
            <tr>
              <td><strong>كرواسون (Croissant)</strong></td>
              <td>30.00 د.ج</td>
              <td>45.00 د.ج</td>
              <td>5 قطع</td>
              <td>15 قطعة</td>
              <td>18 قطعة</td>
              <td><strong style={{ color: '#f59e0b', fontSize: '16px' }}>2 قطعة</strong></td>
              <td style={{ color: '#22c55e', fontWeight: 'bold' }}>+ 270.00 د.ج</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
