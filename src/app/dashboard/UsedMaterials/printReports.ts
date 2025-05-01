// Utility functions for printing reports
interface Column {
  title: string;
  dataIndex?: string;
  key: string;
  render?: (value: any, record: any) => React.ReactNode;
}

// Print invoices report
export const printInvoicesReport = (title: string, data: any[], columns: Column[]) => {
  const content = generateReportHTML(title, data, columns);
  openPrintWindow(content);
};

// Print invoice details report
export const printInvoiceDetailsReport = (
  invoice: any,
  items: any[],
  company: string,
  columns: Column[]
) => {
  const title = `تفاصيل فاتورة رقم ${invoice.invoiceNumber}`;
  
  // Create summary info
  const summarySection = `
    <div class="summary-section">
      <div class="summary-item">
        <span class="label">رقم الفاتورة:</span>
        <span class="value">${invoice.invoiceNumber}</span>
      </div>
      <div class="summary-item">
        <span class="label">التاريخ:</span>
        <span class="value">${new Date(invoice.invoiceDate).toLocaleDateString("ar-EG")}</span>
      </div>
      <div class="summary-item">
        <span class="label">الشركة:</span>
        <span class="value">${company}</span>
      </div>
      <div class="summary-item">
        <span class="label">الحالة:</span>
        <span class="value ${invoice.status === "completed" ? "status-success" : invoice.status === "pending" ? "status-pending" : "status-canceled"}">
          ${invoice.status === "completed" ? "مكتملة" : invoice.status === "pending" ? "معلقة" : "ملغاة"}
        </span>
      </div>
      <div class="summary-item total">
        <span class="label">إجمالي الفاتورة:</span>
        <span class="value">${invoice.totalAmount.toLocaleString()} جنيه</span>
      </div>
    </div>
  `;

  const content = generateReportHTML(title, items, columns, summarySection);
  openPrintWindow(content);
};

// Print consumables report
export const printConsumablesReport = (data: any[], columns: Column[]) => {
  const title = "تقرير المستهلكات";
  const content = generateReportHTML(title, data, columns);
  openPrintWindow(content);
};

// Print equipment report
export const printEquipmentReport = (data: any[], columns: Column[]) => {
  const title = "تقرير المعدات";
  const content = generateReportHTML(title, data, columns);
  openPrintWindow(content);
};

// Generate HTML content for report
const generateReportHTML = (
  title: string,
  data: any[],
  columns: Column[],
  additionalContent: string = ""
) => {
  // Create table headers and rows
  const tableHeaders = columns.map(column => `<th>${column.title}</th>`).join('');
  
  const tableRows = data.map((record, index) => {
    const cells = columns.map(column => {
      let cellContent = '';
      
      if (column.render && column.dataIndex) {
        // If there's a render function, use it to format the content
        try {
          const renderResult = column.render(record[column.dataIndex], record);
          // The render function might return a React element, so we extract the text
          cellContent = typeof renderResult === 'string' ? renderResult : String(renderResult);
        } catch (e) {
          cellContent = record[column.dataIndex] || '-';
        }
      } else if (column.dataIndex) {
        cellContent = record[column.dataIndex] || '-';
      }
      
      return `<td>${cellContent}</td>`;
    });
    
    return `<tr><td>${index + 1}</td>${cells.join('')}</tr>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <title>${title} - عسكر للمقاولات العمومية</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
        body {
          font-family: 'Cairo', sans-serif;
          margin: 10px;
          padding: 20px;
          background-color: #f0f4f8;
          color: #2c3e50;
        }
        .container {
          max-width: 1000px;
          margin: 0 auto;
          background: #fff;
          padding: 0px;
          border-radius: 15px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          border: 2px solid #3498db;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 3px solid #3498db;
          background: #ecf0f1;
          color: #2c3e50;
          border-radius: 10px 10px 0 0;
          padding: 15px;
        }
        .header .logo img {
          max-width: 130px;
          height: auto;
        }
        .header .company-info {
          text-align: center;
          flex: 1;
        }
        .header .company-info h1 {
          font-size: 28px;
          margin: 0;
          font-weight: 700;
        }
        .header .company-info p {
          font-size: 16px;
          margin: 5px 0 0;
        }
        h2 {
          text-align: center;
          font-size: 24px;
          color: #2c3e50;
          margin: 25px 0;
          font-weight: 700;
          position: relative;
        }
        h2::after {
          content: '';
          width: 60px;
          height: 3px;
          background: #3498db;
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 2px;
        }
        .summary-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 20px;
          padding: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: #f9f9f9;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          border-bottom: 1px dashed #ddd;
        }
        .summary-item.total {
          grid-column: 1 / -1;
          font-size: 1.2em;
          font-weight: bold;
          border-top: 2px solid #3498db;
          border-bottom: none;
          padding-top: 15px;
        }
        .summary-item .label {
          font-weight: bold;
          color: #555;
        }
        .status-success {
          color: green;
        }
        .status-pending {
          color: orange;
        }
        .status-canceled {
          color: red;
        }
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin: 20px 0;
          font-size: 15px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        th, td {
          border: 1px solid #bdc3c7;
          padding: 12px;
          text-align: center;
        }
        th {
          background: #3498db;
          color: #fff;
          font-weight: 700;
        }
        td {
          background: #fff;
        }
        tr:nth-child(even) td {
          background: #ecf0f1;
        }
        tr:hover td {
          background: #d5e8f7;
          transition: background 0.3s ease;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px dashed #3498db;
          font-size: 13px;
          color: #7f8c8d;
        }
        .footer strong {
          color: #3498db;
        }
        .timestamp {
          text-align: center;
          font-size: 13px;
          color: #7f8c8d;
          margin-top: 15px;
          font-style: italic;
        }
        .status-low {
          color: red;
          font-weight: bold;
        }
        .status-medium {
          color: orange;
          font-weight: bold;
        }
        .status-ok {
          color: green;
          font-weight: bold;
        }
        @media print {
          body {
            padding: 0;
            background: #fff;
          }
          .container {
            box-shadow: none;
            border: none;
            max-width: 100%;
          }
          .header {
            background: #ecf0f1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          table th {
            background-color: #3498db !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .summary-section {
            background: #f9f9f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          table th, table td {
            font-size: 12px;
            padding: 8px;
          }
          .footer {
            font-size: 11px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-info">
            <h1>عسكر للمقاولات العمومية</h1>
            <p>Askar Group for General Contracting</p>
          </div>
          <div class="logo">
            <img src="/logo.webp" alt="شعار عسكر للمقاولات العمومية" />
          </div>
        </div>

        <h2>${title}</h2>

        ${additionalContent}

        <table>
          <thead>
            <tr>
              <th>#</th>
              ${tableHeaders}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="timestamp">
          تم إنشاء التقرير في: ${new Date().toLocaleString("ar-EG")}
        </div>

        <div class="footer">
          <p>تم تطويره بواسطة <strong>Hamedenho</strong> لصالح <strong>عسكر للمقاولات العمومية</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Open a print window and handle printing
const openPrintWindow = (content: string) => {
  const printWindow = window.open("", "_blank", "width=900,height=600");
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
    setTimeout(() => {
      printWindow.close();
    }, 10000);
  }
}; 