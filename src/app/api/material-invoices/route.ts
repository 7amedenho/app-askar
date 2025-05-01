import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema for creating a new invoice item
const InvoiceItemSchema = z.object({
  itemType: z.string().min(1, "نوع الصنف مطلوب"),
  itemId: z.number().int().positive("معرف الصنف مطلوب"),
  itemName: z.string().min(1, "اسم الصنف مطلوب"),
  quantity: z.number().int().positive("الكمية يجب أن تكون أكبر من صفر"),
  unitPrice: z.number().positive("سعر الوحدة يجب أن يكون أكبر من صفر"),
  totalPrice: z.number().positive("السعر الإجمالي يجب أن يكون أكبر من صفر"),
  notes: z.string().nullable().optional(),
});

// Schema for creating a new invoice
const CreateInvoiceSchema = z.object({
  clientCompanyId: z.number().int().positive("معرف الشركة مطلوب"),
  invoiceNumber: z.string().min(1, "رقم الفاتورة مطلوب"),
  invoiceDate: z.string().min(1, "تاريخ الفاتورة مطلوب"),
  dueDate: z.string().nullable().optional(),
  status: z.string().min(1, "حالة الفاتورة مطلوبة"),
  totalAmount: z.number().nonnegative("المبلغ الإجمالي يجب أن يكون 0 أو أكبر"),
  paidAmount: z.number().nonnegative("المبلغ المدفوع يجب أن يكون 0 أو أكبر").optional(),
  notes: z.string().nullable().optional(),
  items: z.array(InvoiceItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  updateInventory: z.boolean().optional(),
});

// GET handler to list all invoices
export async function GET() {
  try {
    const invoices = await prisma.materialInvoice.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching material invoices:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب بيانات الفواتير" },
      { status: 500 }
    );
  }
}

// POST handler to create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = CreateInvoiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await prisma.clientCompany.findUnique({
      where: { id: body.clientCompanyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: "لم يتم العثور على الشركة" },
        { status: 404 }
      );
    }

    // Check if invoice number is unique for this company
    const existingInvoice = await prisma.materialInvoice.findFirst({
      where: {
        clientCompanyId: body.clientCompanyId,
        invoiceNumber: body.invoiceNumber,
      },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: "رقم الفاتورة موجود بالفعل لهذه الشركة" },
        { status: 400 }
      );
    }

    // Create new invoice with items in a transaction to update inventory quantities
    const newInvoice = await prisma.$transaction(async (tx) => {
      // First create the invoice
      const invoice = await tx.materialInvoice.create({
        data: {
          clientCompanyId: body.clientCompanyId,
          invoiceNumber: body.invoiceNumber,
          invoiceDate: new Date(body.invoiceDate),
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          status: body.status,
          totalAmount: body.totalAmount,
          paidAmount: body.paidAmount || 0,
          notes: body.notes || null,
        },
      });

      // Add items to the invoice
      const items = [];
      for (const item of body.items) {
        // Separate ID handling for different item types
        const itemData: any = {
          invoiceId: invoice.id,
          itemType: item.itemType,
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes || null,
        };

        // Handle inventory connections based on type
        if (item.itemType === 'inventory_consumable') {
          // Check stock first
          const consumable = await tx.inventoryConsumable.findUnique({
            where: { id: item.itemId },
          });
          
          if (!consumable) {
            throw new Error(`المستهلك غير موجود: ${item.itemName}`);
          }
          
          if (consumable.stock < item.quantity) {
            throw new Error(`لا يوجد كمية كافية من المستهلك: ${item.itemName} (المتوفر: ${consumable.stock})`);
          }
          
          // Set relation ID
          itemData.inventoryConsumableId = item.itemId;
          
          // Update inventory if flag is set
          if (body.updateInventory !== false) {
            // Update stock
            await tx.inventoryConsumable.update({
              where: { id: item.itemId },
              data: {
                stock: { decrement: item.quantity },
              },
            });
          }
        } else if (item.itemType === 'inventory_equipment') {
          // Check quantity first
          const equipment = await tx.inventoryEquipment.findUnique({
            where: { id: item.itemId },
          });
          
          if (!equipment) {
            throw new Error(`المعدة غير موجودة: ${item.itemName}`);
          }
          
          if (equipment.quantity < item.quantity) {
            throw new Error(`لا يوجد كمية كافية من المعدة: ${item.itemName} (المتوفر: ${equipment.quantity})`);
          }
          
          // Set relation ID
          itemData.inventoryEquipmentId = item.itemId;
          
          // Update inventory if flag is set
          if (body.updateInventory !== false) {
            // Update quantity
            await tx.inventoryEquipment.update({
              where: { id: item.itemId },
              data: {
                quantity: { decrement: item.quantity },
              },
            });
          }
        }

        // Create the invoice item
        const invoiceItem = await tx.materialInvoiceItem.create({
          data: itemData,
        });
        
        items.push(invoiceItem);
      }

      // Return the complete invoice with items
      return {
        ...invoice,
        items,
      };
    });

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error: any) {
    console.error("Error creating material invoice:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء إنشاء الفاتورة" },
      { status: 500 }
    );
  }
} 