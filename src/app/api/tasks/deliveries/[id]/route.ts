import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET a specific task delivery by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid task delivery ID" },
        { status: 400 }
      );
    }
    
    const delivery = await prisma.taskDelivery.findUnique({
      where: { id },
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
      }
    });
    
    if (!delivery) {
      return NextResponse.json(
        { error: "Task delivery not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(delivery);
  } catch (error) {
    console.error("Error fetching task delivery:", error);
    return NextResponse.json(
      { error: "Failed to fetch task delivery" },
      { status: 500 }
    );
  }
}

// DELETE a task delivery
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid task delivery ID" },
        { status: 400 }
      );
    }
    
    // Check if the task delivery exists
    const delivery = await prisma.taskDelivery.findUnique({
      where: { id },
      include: {
        taskItem: true
      }
    });
    
    if (!delivery) {
      return NextResponse.json(
        { error: "Task delivery not found" },
        { status: 404 }
      );
    }
    
    // Delete the delivery and restore the quantity in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the delivery
      await tx.taskDelivery.delete({
        where: { id }
      });
      
      // Restore the quantity to the task item
      await tx.taskItem.update({
        where: { id: delivery.taskItemId },
        data: {
          quantity: { increment: delivery.quantity }
        }
      });
    });
    
    return NextResponse.json(
      { message: "Task delivery deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting task delivery:", error);
    return NextResponse.json(
      { error: "Failed to delete task delivery" },
      { status: 500 }
    );
  }
} 