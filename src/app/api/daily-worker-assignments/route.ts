import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/daily-worker-assignments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (projectId) where.projectId = parseInt(projectId);
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const assignments = await prisma.dailyWorkerAssignment.findMany({
      where,
      include: {
        project: true,
        workers: {
          include: {
            employee: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/daily-worker-assignments
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, date, engineer, workers } = body;

    const assignment = await prisma.dailyWorkerAssignment.create({
      data: {
        projectId: parseInt(projectId),
        date: new Date(date),
        engineer: engineer,
        workers: {
          create: workers.map((worker: any) => ({
            employeeId: worker.employeeId,
            checkIn: new Date(worker.checkIn),
            notes: worker.notes,
          })),
        },
      },
      include: {
        project: true,
        workers: {
          include: {
            employee: true,
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/daily-worker-assignments/:id
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const { workers } = body;

    const assignment = await prisma.dailyWorkerAssignment.update({
      where: { id: parseInt(id!) },
      data: {
        workers: {
          deleteMany: {}, // Delete all existing workers
          create: workers.map((worker: any) => ({
            employeeId: worker.employeeId,
            checkIn: new Date(worker.checkIn),
            checkOut: worker.checkOut ? new Date(worker.checkOut) : null,
            notes: worker.notes,
          })),
        },
      },
      include: {
        project: true,
        workers: {
          include: {
            employee: true,
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 