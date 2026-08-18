import { formatDate, formatDZD, formatTime, ShiftSummaryCalculation } from '@bakery/core';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getAppSettings, getShiftById } from '../db/queries';

export class PDFService {
  /**
   * Generates a clean Arabic RTL Daily/Shift Report PDF file using expo-print.
   */
  static async generateShiftReportPDF(shiftId: number, summary: ShiftSummaryCalculation): Promise<string> {
    const appSettings = await getAppSettings();
    const shift = await getShiftById(shiftId);

    const dateFormatted = shift ? formatDate(shift.date, 'ar') : formatDate(new Date().toISOString(), 'ar');
    const timeFormatted = shift ? formatTime(shift.startedAt, 'ar') : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>تقرير المخبزة اليومي</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #1e293b;
            background: #ffffff;
            direction: rtl;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #e2e8f0;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 26px;
            color: #0f172a;
            margin: 0 0 5px 0;
          }
          .header p {
            font-size: 14px;
            color: #64748b;
            margin: 2px 0;
          }
          .badge {
            display: inline-block;
            background-color: #f1f5f9;
            color: #334155;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: bold;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            border-right: 4px solid #f59e0b;
            padding-right: 10px;
            margin-bottom: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 14px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            text-align: right;
          }
          th {
            background-color: #f8fafc;
            color: #475569;
            font-weight: bold;
          }
          .summary-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
          }
          .kpi {
            text-align: center;
            flex: 1;
          }
          .kpi-title {
            font-size: 12px;
            color: #64748b;
          }
          .kpi-value {
            font-size: 18px;
            font-weight: bold;
            margin-top: 4px;
          }
          .positive { color: #16a34a; }
          .negative { color: #dc2626; }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${appSettings.bakeryName}</h1>
          <p>${appSettings.address || 'الجزائر'} | هاتف: ${appSettings.phone || '-'}</p>
          <p><span class="badge">تقرير الوردية (${shift?.shiftType === 'MORNING' ? appSettings.morningShiftName : appSettings.eveningShiftName})</span></p>
          <p>التاريخ: ${dateFormatted} | البدء: ${timeFormatted}</p>
        </div>

        <!-- Financial Summary -->
        <div class="section">
          <div class="section-title">الملخص المالي العام</div>
          <table>
            <tr>
              <th>البيان</th>
              <th>المبلغ (د.ج)</th>
            </tr>
            <tr>
              <td>مداخيل بيع الخبز (الشاريوات)</td>
              <td><strong>${formatDZD(summary.breadRevenue, 'ar')}</strong></td>
            </tr>
            <tr>
              <td>مداخيل المنتجات الخارجية (الكسرة والبيتزا...)</td>
              <td><strong>${formatDZD(summary.externalRevenue, 'ar')}</strong></td>
            </tr>
            <tr>
              <td>تكلفة المنتجات المباعة (شراء البضاعة)</td>
              <td class="negative">- ${formatDZD(summary.externalCost, 'ar')}</td>
            </tr>
            <tr>
              <td>مستحقات وتشوفاج العمال</td>
              <td class="negative">- ${formatDZD(summary.workerPayments, 'ar')}</td>
            </tr>
            <tr>
              <td>المصاريف التشغيلية والأخرى</td>
              <td class="negative">- ${formatDZD(summary.otherExpenses, 'ar')}</td>
            </tr>
            <tr style="background-color: #f1f5f9;">
              <td><strong>الصافي المستحق للمخبزة (Net Amount)</strong></td>
              <td><strong class="positive">${formatDZD(summary.netAmount, 'ar')}</strong></td>
            </tr>
            <tr>
              <td>المبلغ النقدي المستلم (الأقاس الفعلي)</td>
              <td><strong>${formatDZD(summary.actualCash, 'ar')}</strong></td>
            </tr>
            <tr>
              <td>الفرق النقد (فائض / عجز)</td>
              <td><strong class="${summary.cashDifference >= 0 ? 'positive' : 'negative'}">${formatDZD(summary.cashDifference, 'ar')}</strong></td>
            </tr>
          </table>
        </div>

        <!-- Bread Details -->
        <div class="section">
          <div class="section-title">تفاصيل إنتاج ومداخيل الخبز</div>
          <table>
            <thead>
              <tr>
                <th>نوع الخبز</th>
                <th>الكمية المنتجة (خبزة)</th>
                <th>المداخيل (د.ج)</th>
              </tr>
            </thead>
            <tbody>
              ${Object.values(summary.breadTotalsByType)
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatDZD(item.revenue, 'ar')}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <!-- External Products -->
        <div class="section">
          <div class="section-title">حركة المنتجات الخارجية والمخزون المتبقي</div>
          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>مخزون البداية</th>
                <th>مُستلم</th>
                <th>مباع</th>
                <th>المتبقي (ينتقل)</th>
                <th>المداخيل</th>
                <th>الربح</th>
              </tr>
            </thead>
            <tbody>
              ${summary.productSummaries
                .map(
                  (p) => `
                <tr>
                  <td>${p.productName}</td>
                  <td>${p.openingQty}</td>
                  <td>${p.addedQty}</td>
                  <td>${p.soldQty}</td>
                  <td><strong>${p.remainingQty}</strong></td>
                  <td>${formatDZD(p.revenueOfSold, 'ar')}</td>
                  <td class="positive">${formatDZD(p.profitOfSold, 'ar')}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          تم إنشاء هذا التقرير آلياً بواسطة تطبيق إدارة المخبزة - ${new Date().toLocaleString('ar-DZ')}
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    return uri;
  }

  /**
   * Shares the generated PDF file using native OS share dialog (WhatsApp, Email, etc.)
   */
  static async sharePDF(pdfUri: string): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('المشاركة غير متاحة على هذا الجهاز');
    }
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'مشاركة تقرير المخبزة Daily Report',
      UTI: 'com.adobe.pdf'
    });
  }
}
