'use client';

import { useState } from 'react';
import { DatePicker, Select, Table, Button, Modal, Form, Input, message } from 'antd';
import dayjs from 'dayjs';
import { Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const { Option } = Select;

interface Project {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
  jobTitle: string;
}

interface WorkerAssignment {
  id: number;
  employeeId: number;
  employee: Employee;
  checkIn: string;
  checkOut: string | null;
  notes: string | null;
}

interface DailyAssignment {
  id: number;
  projectId: number;
  project: Project;
  date: string;
  engineer: string;
  workers: WorkerAssignment[];
}

// API functions
const fetchProjects = async () => {
  const { data } = await axios.get('/api/projects');
  return data;
};

const fetchEmployees = async () => {
  const { data } = await axios.get('/api/employees');
  return data;
};

const fetchAssignments = async (params: { projectId?: number; startDate?: string; endDate?: string }) => {
  const { data } = await axios.get('/api/daily-worker-assignments', { params });
  return data;
};

const createAssignment = async (assignment: {
  projectId: number;
  date: string;
  engineer: string;
  workers: { employeeId: number; checkIn: string }[];
}) => {
  const { data } = await axios.post('/api/daily-worker-assignments', assignment);
  return data;
};

export default function DailyWorkerAssignments() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Queries
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });

  const { data: assignments = [] } = useQuery<DailyAssignment[]>({
    queryKey: ['assignments', selectedProject, startDate?.format('YYYY-MM-DD'), endDate?.format('YYYY-MM-DD')],
    queryFn: () => fetchAssignments({
      projectId: selectedProject || undefined,
      startDate: startDate?.format('YYYY-MM-DD'),
      endDate: endDate?.format('YYYY-MM-DD'),
    }),
  });

  // Mutations
  const createAssignmentMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      message.success('تم إنشاء التسجيل بنجاح');
      toast.success('تم إنشاء التسجيل بنجاح');
      setIsModalVisible(false);
      form.resetFields();
    },
    onError: () => {
      message.error('فشل إنشاء التسجيل');
      toast.error('فشل إنشاء التسجيل');
    },
  });

  const handleCreateAssignment = async () => {
    try {
      const values = await form.validateFields();
      createAssignmentMutation.mutate({
        projectId: selectedProject!,
        date: selectedDate?.format('YYYY-MM-DD')!,
        engineer: values.engineer,
        workers: selectedWorkers.map(employeeId => ({
          employeeId,
          checkIn: new Date().toISOString(),
        })),
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handlePrint = () => {
    const content = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير العاملين - عسكر للمقاولات العمومية</title>
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
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
          }
          .header .company-info p {
            font-size: 16px;
            margin: 5px 0 0;
            opacity: 0.9;
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
            .summary{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
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
            text-transform: uppercase;
            letter-spacing: 1px;
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
            font-weight: 700;
          }
          .timestamp {
            text-align: center;
            font-size: 13px;
            color: #7f8c8d;
            margin-top: 15px;
            font-style: italic;
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

          <h2>تقرير العمال اليومي</h2>
          <div class="summary">
          <h3>المشروع: ${assignments[0]?.project.name}</h3>
          <h3>المهندس: ${assignments[0]?.engineer}</h3>
          <h3>التاريخ: ${new Date(assignments[0]?.date).toLocaleDateString("ar-EG")}</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>الرقم</th>
                <th>اسم العامل</th>
                <th>الوظيفة</th>    
              </tr>
            </thead>
            <tbody>
              ${assignments[0]?.workers.map(
      (worker, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${worker.employee.name}</td>
                  <td>${worker.employee.jobTitle}</td>
                </tr>
              `
    ).join('')}
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

  const columns = [
    {
      title: 'اليوم',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'المشروع',
      dataIndex: ['project', 'name'],
      key: 'project',
    },
    {
      title: 'المهندس',
      dataIndex: 'engineer',
      key: 'engineer',
    },
    {
      title: 'العمال',
      dataIndex: 'workers',
      key: 'workers',
      render: (workers: WorkerAssignment[]) => (
        <ul>
          {workers.map(worker => (
            <li key={worker.id}>
              {worker.employee.name} ({worker.employee.jobTitle})
            </li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">تسجيل العمال اليومي</h1>

      <div className="flex gap-4 mb-6 justify-center">
        <Select
          placeholder="اختر المشروع"
          style={{ width: 350 }}
          onChange={value => setSelectedProject(value)}
          allowClear
        >
          {projects.map(project => (
            <Option key={project.id} value={project.id}>
              {project.name}
            </Option>
          ))}
        </Select>

        <DatePicker
          placeholder="تاريخ البداية"
          onChange={date => setStartDate(date)}
          allowClear
        />

        <DatePicker
          placeholder="تاريخ النهاية"
          onChange={date => setEndDate(date)}
          allowClear
        />
        <div className="flex gap-4">
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            تسجيل عامل
          </Button>
          <Button type="default" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            طباعة
          </Button>
        </div>
      </div>

      <Table
        dataSource={assignments}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="تسجيل عامل"
        open={isModalVisible}
        onOk={handleCreateAssignment}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={createAssignmentMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="project"
            label="المشروع"
            rules={[{ required: true, message: 'يرجى اختيار المشروع' }]}
          >
            <Select
              placeholder="اختر المشروع"
              onChange={value => setSelectedProject(value)}
            >
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="engineer"
            label="اسم المهندس"
            rules={[{ required: true, message: 'يرجى إدخال اسم المهندس' }]}
          >
            <Input placeholder="أدخل اسم المهندس" />
          </Form.Item>

          <Form.Item
            name="date"
            label="تاريخ اليوم"
            rules={[{ required: true, message: 'يرجى اختيار التاريخ' }]}
          >
            <DatePicker
              onChange={date => setSelectedDate(date)}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="workers"
            label="العمال"
            rules={[{ required: true, message: 'يرجى اختيار العمال' }]}
          >
            <Select
              mode="multiple"
              placeholder="اختر العمال"
              onChange={value => setSelectedWorkers(value)}
              style={{ width: '100%' }}
            >
              {employees.map(employee => (
                <Option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.jobTitle})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 