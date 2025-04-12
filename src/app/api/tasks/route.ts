import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all task items (المهمات)
export async function GET() {
  try {
    const taskItems = await prisma.taskItem.findMany({
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
      },
      orderBy: {
        createdAt: "desc",
      }
    });

    return NextResponse.json(taskItems);
  } catch (error) {
    console.error("Error fetching task items:", error);
    return NextResponse.json(
      { error: "Failed to fetch task items" },
      { status: 500 }
    );
  }
}

// POST create a new task item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the required fields
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
    
    // Create the new task item
    const newTaskItem = await prisma.taskItem.create({
      data: {
        name,
        quantity: parseInt(quantity)
      }
    });
    
    return NextResponse.json(newTaskItem, { status: 201 });
  } catch (error) {
    console.error("Error creating task item:", error);
    return NextResponse.json(
      { error: "Failed to create task item" },
      { status: 500 }
    );
  }
} 