import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all task deliveries
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskItemId = searchParams.get("taskItemId");
    const employeeId = searchParams.get("employeeId");
    
    const where: any = {};
    
    if (taskItemId) {
      where.taskItemId = parseInt(taskItemId);
    }
    
    if (employeeId) {
      where.employeeId = parseInt(employeeId);
    }
    
    const deliveries = await prisma.taskDelivery.findMany({
      where,
      include: {
        taskItem: true,
        employee: {
          select: {
            id: true,
            name: true,
            jobTitle: true,
            phoneNumber: true
          }
        }
      },
      orderBy: {
        date: "desc",
      }
    });
    
    return NextResponse.json(deliveries);
  } catch (error) {
    console.error("Error fetching task deliveries:", error);
    return NextResponse.json(
      { error: "Failed to fetch task deliveries" },
      { status: 500 }
    );
  }
}

// POST create a new task delivery
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the required fields
    const { taskItemId, employeeId, quantity, notes } = body;
    
    if (!taskItemId || !employeeId || !quantity) {
      return NextResponse.json(
        { error: "Task item, employee, and quantity are required fields" },
        { status: 400 }
      );
    }
    
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be a positive number" },
        { status: 400 }
      );
    }
    
    // Check if the task item exists and has enough quantity
    const taskItem = await prisma.taskItem.findUnique({
      where: { id: parseInt(taskItemId) }
    });
    
    if (!taskItem) {
      return NextResponse.json(
        { error: "Task item not found" },
        { status: 404 }
      );
    }
    
    if (taskItem.quantity < parseInt(quantity)) {
      return NextResponse.json(
        { error: "Not enough quantity available in inventory" },
        { status: 400 }
      );
    }
    
    // Check if the employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) }
    });
    
    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }
    
    // Create the delivery record and update inventory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the delivery record
      const delivery = await tx.taskDelivery.create({
        data: {
          taskItemId: parseInt(taskItemId),
          employeeId: parseInt(employeeId),
          quantity: parseInt(quantity),
          notes: notes || null,
          date: new Date()
        }
      });
      
      // Update the task item quantity
      await tx.taskItem.update({
        where: { id: parseInt(taskItemId) },
        data: {
          quantity: { decrement: parseInt(quantity) }
        }
      });
      
      return delivery;
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating task delivery:", error);
    return NextResponse.json(
      { error: "Failed to create task delivery" },
      { status: 500 }
    );
  }
} 