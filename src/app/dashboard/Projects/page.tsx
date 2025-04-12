"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialChart } from "@/components/ui/cyrclechart";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button, Input, Modal, Select } from "antd";
import {
  File,
  PlusCircleIcon,
  Search,
  AlignJustify,
  Edit,
  Trash,
} from "lucide-react";
import { useState } from "react";
import NewProject from "./NewProject";
import EditProject from "./EditProject";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";

const { Option } = Select;

interface Project {
  id: number;
  name: string;
  managerName: string;
  startDate: string;
  status: string;
  custodies: {
    id: number;
    name: string;
    code: string;
    budget: number;
    remaining: number;
  }[];
  createdAt: string;
}

export default function Page() {
  const queryClient = useQueryClient();

  const fetchProjects = async (): Promise<Project[]> => {
    const response = await axios.get("/api/projects");
    return response.data;
  };

  const deleteProject = async (id: number) => {
    await axios.delete(`/api/projects/${id}`);
  };

  const [isNewOpen, setIsNewOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>("all");

  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery<Project[], Error>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const mutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("تم حذف المشروع بنجاح!");
    },
    onError: () => {
      toast.error("حدث خطأ في حذف المشروع");
    },
  });

  const filteredAndSortedProjects = projects
    .filter((project) => {
      const matchesSearch = project.name
        .toLowerCase()
        .includes(searchInput.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || project.status === "active";
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-1/4 mx-auto" />
        <div className="flex items-center gap-4 border-b pb-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {Array(2)
            .fill(0)
            .map((_, index) => (
              <Card key={index} className="w-full">
                <CardHeader className="flex items-center justify-between">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-6" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 w-full rounded-full" />
                    <div className="space-y-4 col-span-2">
                      {Array(6)
                        .fill(0)
                        .map((_, i) => (
                          <div key={i}>
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-5 w-3/4 mt-1" />
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 text-red-500">
        حدث خطأ: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold text-center">إدارة المشاريع</h1>
      <div className="flex items-center gap-4 border-b pb-4">
        <Input
          className="w-full"
          placeholder="بحث"
          prefix={<Search />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select
          value={filterStatus}
          onChange={(value) => setFilterStatus(value)}
          className="w-32"
        >
          <Option value="all">الكل</Option>
          <Option value="active">المفعلة فقط</Option>
        </Select>
        <Button
          type="primary"
          className="flex items-center gap-2"
          onClick={() => setIsNewOpen(true)}
        >
          <PlusCircleIcon size={18} />
          <span>إنشاء مشروع</span>
        </Button>
        <Button type="text" className="flex items-center gap-2">
          <File size={18} />
          <span>تقارير</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        {filteredAndSortedProjects?.map((project: Project) => {
          const totalbudget = project.custodies.reduce(
            (sum, c) => sum + c.budget,
            0
          );
          const remainingbudget = project.custodies.reduce(
            (sum, c) => sum + c.remaining,
            0
          );

          return (
            <Card key={project.id} className="w-full">
              <CardHeader className="flex items-center justify-between">
                <CardTitle>تفاصيل المشروع</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <AlignJustify className="cursor-pointer hover:opacity-80 duration-300" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedProject(project);
                        setIsEditOpen(true);
                      }}
                    >
                      <Edit className="mr-2" /> تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-800"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setIsModalOpen(true);
                      }}
                    >
                      <Trash className="mr-2 text-red-500" /> حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FinancialChart
                    totalAmount={totalbudget}
                    remainingAmount={remainingbudget}
                  />
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    {[
                      { label: "اسم المشروع", value: project.name },
                      { label: "اسم المدير", value: project.managerName },
                      {
                        label: "تاريخ البدء",
                        value: new Date(project.startDate).toLocaleDateString(
                          "ar-EG"
                        ),
                      },
                      {
                        label: "الحالة",
                        value:
                          project.status === "active" ? "مفعل" : "غير مفعل",
                      },
                      {
                        label: "إجمالي العهد",
                        value: totalbudget.toLocaleString("ar-EG"),
                      },
                      {
                        label: "الكمية المتبقية",
                        value: remainingbudget.toLocaleString("ar-EG"),
                      },
                      {
                        label: "تاريخ الإنشاء",
                        value: new Date(project.createdAt).toLocaleDateString(
                          "ar-EG"
                        ),
                      },
                    ].map((item, index) => (
                      <div key={index} className="flex space-x-2">
                        <p className="text-md text-gray-900 dark:text-white">
                          {item.label}:
                        </p>
                        <p
                          className={
                            item.label === "الحالة" &&
                            project.status === "active"
                              ? "text-green-700 dark:text-green-300"
                              : item.label === "الحالة" &&
                                project.status === "inactive"
                              ? "text-red-700 dark:text-red-300"
                              : "text-blue-700 dark:text-blue-300"
                          }
                        >
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Modal
        title="تأكيد الحذف"
        open={isModalOpen}
        onOk={() => {
          if (selectedProjectId !== null) {
            mutation.mutate(selectedProjectId);
            setIsModalOpen(false);
          }
        }}
        onCancel={() => setIsModalOpen(false)}
        okText="نعم، احذف"
        cancelText="إلغاء"
        okButtonProps={{ danger: true }}
      >
        <p>هل أنت متأكد أنك تريد حذف هذا المشروع؟</p>
      </Modal>
      {isNewOpen && (
        <NewProject isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} />
      )}
      {isEditOpen && selectedProject?.id && (
        <EditProject
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          projectId={selectedProject?.id?.toString() ?? null}
        />
      )}
    </div>
  );
}
