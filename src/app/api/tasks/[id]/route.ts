import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET a specific task item by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid task item ID" },
        { status: 400 }
      );
    }

    const taskItem = await prisma.taskItem.findUnique({
      where: { id },
      include: {
        deliveries: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            date: "desc",
          }
        }
      }
    });

    if (!taskItem) {
      return NextResponse.json(
        { error: "Task item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(taskItem);
  } catch (error) {
    console.error("Error fetching task item:", error);
    return NextResponse.json(
      { error: "Failed to fetch task item" },
      { status: 500 }
    );
  }
}

// UPDATE a task item
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid task item ID" },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { name, quantity } = body;
    
    if (!name || !quantity) {
      return NextResponse.json(
        { error: "Name and quantity are required fields" },
        { status: 400 }
      );
    }
    
    if (isNaN(quantity) || quantity < 0) {
      return NextResponse.json(
        { error: "Quantity must be a positive number" },
        { status: 400 }
      );
    }
    
    // Check if the task item exists
    const existingTaskItem = await prisma.taskItem.findUnique({
      where: { id }
    });
    
    if (!existingTaskItem) {
      return NextResponse.json(
        { error: "Task item not found" },
        { status: 404 }
      );
    }
    
    // Update the task item
    const updatedTaskItem = await prisma.taskItem.update({
      where: { id },
      data: {
        name,
        quantity: parseInt(quantity)
      }
    });
    
    return NextResponse.json(updatedTaskItem);
  } catch (error) {
    console.error("Error updating task item:", error);
    return NextResponse.json(
      { error: "Failed to update task item" },
      { status: 500 }
    );
  }
}

// DELETE a task item
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid task item ID" },
        { status: 400 }
      );
    }
    
    // Check if the task item exists
    const existingTaskItem = await prisma.taskItem.findUnique({
      where: { id }
    });
    
    if (!existingTaskItem) {
      return NextResponse.json(
        { error: "Task item not found" },
        { status: 404 }
      );
    }
    
    // Delete all related task deliveries first to avoid foreign key constraint errors
    await prisma.taskDelivery.deleteMany({
      where: { taskItemId: id }
    });
    
    // Delete the task item
    await prisma.taskItem.delete({
      where: { id }
    });
    
    return NextResponse.json(
      { message: "Task item deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting task item:", error);
    return NextResponse.json(
      { error: "Failed to delete task item" },
      { status: 500 }
    );
  }
} 