import { NextResponse } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const patchPaymentSchema = z
  .object({
    status: z.enum(["VERIFIED", "PAID", "REJECTED", "REFUNDED"]),
    auditNote: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.status === "REJECTED" && (!data.auditNote || data.auditNote.length < 3)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["auditNote"],
        message: "An audit note explaining the rejection reason is required.",
      });
    }
  });

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: { items: true },
        },
        verifiedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        method: payment.method,
        status: payment.status,
        amount: Number(payment.amount),
        trxId: payment.trxId,
        senderAccount: payment.senderAccount,
        auditNote: payment.auditNote,
        verifiedAt: payment.verifiedAt?.toISOString() ?? null,
        verifiedBy: payment.verifiedBy,
        createdAt: payment.createdAt.toISOString(),
        order: {
          id: payment.order.id,
          orderRef: payment.order.orderRef,
          customerName: payment.order.customerName,
          customerPhone: payment.order.customerPhone,
          city: payment.order.city,
          fulfillmentStatus: payment.order.fulfillmentStatus,
          totalAmount: Number(payment.order.totalAmount),
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/payments/[id]]", error);
    return NextResponse.json(
      { error: "Failed to load payment details." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { admin, errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = patchPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payment update." },
        { status: 400 }
      );
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: parsed.data.status as PaymentStatus,
        verifiedById: admin.id,
        verifiedAt: new Date(),
        auditNote: parsed.data.auditNote ? parsed.data.auditNote : null,
      },
      include: {
        verifiedBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      auditNote: updated.auditNote,
      verifiedAt: updated.verifiedAt?.toISOString() ?? null,
      verifiedBy: updated.verifiedBy,
    });
  } catch (error) {
    console.error("[PATCH /api/admin/payments/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update payment status." },
      { status: 500 }
    );
  }
}
