import { Table } from "antd";
import React from "react";

export default function page() {
  const columns = [
    { title: "الاسم", dataIndex: "name", key: "name" },
    { title: "الوظيفة", dataIndex: "job", key: "job" },
    { title: "اليومية", dataIndex: "salary", key: "salary" },
    { title: "رقم الهاتف", dataIndex: "phone", key: "phone" },
    { title: "الرقم القومي", dataIndex: "natId", key: "natId" },
    { title: "", dataIndex: "actions", key: "actions" },
  ];

  return (
    <div>
      <Table columns={columns} dataSource={[]} />
    </div>
  );
}
