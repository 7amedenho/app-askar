export const printEmployeesAttendance = (records: any) => {
  const content = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <title>تقرير الحضور والانصراف - عسكر للمقاولات العمومية</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
        body {
          font-family: 'Cairo', sans-serif;
          margin: 0;
          padding: 1px;
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
        .status-present {
          color: green;
          font-weight: bold;
        }
        .status-late {
          color: orange;
          font-weight: bold;
        }
        .status-early-leave {
          color: red;
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
          }
          .header {
            background: #ecf0f1;
            -webkit-print-color-adjust: exact;
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

        <h2>تقرير الحضور والانصراف</h2>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الموظف</th>
              <th>الوظيفة</th>
              <th>التاريخ</th>
              <th>وقت الحضور</th>
              <th>وقت الانصراف</th>
              <th>عدد الساعات</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${records
              .map((record: any, index: number) => {
                const checkInTime = new Date(record.checkIn);
                const checkOutTime = record.checkOut
                  ? new Date(record.checkOut)
                  : null;
                const hoursWorked = checkOutTime
                  ? (
                      (checkOutTime.getTime() - checkInTime.getTime()) /
                      (1000 * 60 * 60)
                    ).toFixed(2)
                  : "--";

                let status = "حاضر";
                let statusClass = "status-present";

                if (!record.checkOut) {
                  status = "لم يسجل خروج";
                  statusClass = "status-late";
                } else if (
                  checkInTime.getHours() >= 8 &&
                  checkInTime.getMinutes() > 0
                ) {
                  status = "متأخر";
                  statusClass = "status-late";
                } else if (checkOutTime && checkOutTime.getHours() < 15) {
                  status = "خروج مبكر";
                  statusClass = "status-early-leave";
                }

                return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${record.employee.name}</td>
                  <td>${record.employee.jobTitle}</td>
                  <td>${new Date(record.date).toLocaleDateString("ar-EG")}</td>
                  <td>${checkInTime.toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}</td>
                  <td>${
                    checkOutTime
                      ? checkOutTime.toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--"
                  }</td>
                  <td>${hoursWorked}</td>
                  <td><span class="${statusClass}">${status}</span></td>
                </tr>
              `;
              })
              .join("")}
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
