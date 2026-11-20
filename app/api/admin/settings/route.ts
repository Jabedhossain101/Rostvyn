import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { getPublicSettings } from "@/lib/storefront";

const paymentAccountSchema = z.object({
  label: z.string().trim().min(1),
  bankName: z.string().trim().min(1),
  accountName: z.string().trim().min(1),
  accountNumber: z.string().trim().min(1),
  routingOrSwift: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
});

const putSettingsSchema = z.object({
  storeName: z.string().trim().min(1).max(100).optional(),
  currencyCode: z.enum(["USD", "EUR", "GBP", "AUD"]).optional(),
  freeShippingThreshold: z.coerce.number().min(0).optional(),
  metroDeliveryFee: z.coerce.number().min(0).optional(),
  nationalDeliveryFee: z.coerce.number().min(0).optional(),
  contactPhone: z.string().trim().max(40).nullable().optional(),
  contactEmail: z.string().trim().email().nullable().optional().or(z.literal("")),
  address: z.string().trim().max(400).nullable().optional(),
  paymentAccounts: z.array(paymentAccountSchema).optional(),
  announcementText: z.string().trim().max(240).nullable().optional(),
  heroData: z
    .object({
      eyebrow: z.string().trim().max(120),
      headline: z.string().trim().max(200),
      subheadline: z.string().trim().max(400),
      ctaLabel: z.string().trim().max(60),
      ctaHref: z.string().trim().max(120),
      imageUrl: z.string().trim().url(),
    })
    .optional(),
  storyData: z
    .object({
      title: z.string().trim().max(160),
      body: z.string().trim().max(1200),
      roastDays: z.string().trim().max(80),
    })
    .optional(),
  policyTexts: z
    .object({
      privacy: z.string().optional(),
      terms: z.string().optional(),
      returns: z.string().optional(),
      shipping: z.string().optional(),
    })
    .optional(),
});

export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const settings = await getPublicSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[GET /api/admin/settings]", error);
    return NextResponse.json(
      { error: "Failed to load settings." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { admin, errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = putSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid settings payload." },
        { status: 400 }
      );
    }

    const d = parsed.data;

    // Strict RBAC: STAFF is blocked (403) from modifying financial settings or payment accounts
    const touchesFinancialOrPayment =
      d.currencyCode !== undefined ||
      d.freeShippingThreshold !== undefined ||
      d.metroDeliveryFee !== undefined ||
      d.nationalDeliveryFee !== undefined ||
      d.paymentAccounts !== undefined;

    if (touchesFinancialOrPayment && admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error:
            "Forbidden. Only Super Admins may modify financial settings or merchant payment accounts.",
        },
        { status: 403 }
      );
    }

    await prisma.storeSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        storeName: d.storeName ?? "Rostvyn",
        currencyCode: d.currencyCode ?? "USD",
        freeShippingThreshold: d.freeShippingThreshold ?? 45,
        metroDeliveryFee: d.metroDeliveryFee ?? 5,
        nationalDeliveryFee: d.nationalDeliveryFee ?? 12,
        contactPhone: d.contactPhone || null,
        contactEmail: d.contactEmail || null,
        address: d.address || null,
        paymentAccounts:
          d.paymentAccounts !== undefined
            ? (d.paymentAccounts as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        announcementText: d.announcementText || null,
        heroData:
          d.heroData !== undefined
            ? (d.heroData as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        storyData:
          d.storyData !== undefined
            ? (d.storyData as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        policyTexts:
          d.policyTexts !== undefined
            ? (d.policyTexts as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
      },
      update: {
        ...(d.storeName !== undefined ? { storeName: d.storeName } : {}),
        ...(d.currencyCode !== undefined ? { currencyCode: d.currencyCode } : {}),
        ...(d.freeShippingThreshold !== undefined
          ? { freeShippingThreshold: d.freeShippingThreshold }
          : {}),
        ...(d.metroDeliveryFee !== undefined
          ? { metroDeliveryFee: d.metroDeliveryFee }
          : {}),
        ...(d.nationalDeliveryFee !== undefined
          ? { nationalDeliveryFee: d.nationalDeliveryFee }
          : {}),
        ...(d.contactPhone !== undefined
          ? { contactPhone: d.contactPhone || null }
          : {}),
        ...(d.contactEmail !== undefined
          ? { contactEmail: d.contactEmail || null }
          : {}),
        ...(d.address !== undefined ? { address: d.address || null } : {}),
        ...(d.paymentAccounts !== undefined
          ? {
              paymentAccounts:
                d.paymentAccounts as unknown as Prisma.InputJsonValue,
            }
          : {}),
        ...(d.announcementText !== undefined
          ? { announcementText: d.announcementText || null }
          : {}),
        ...(d.heroData !== undefined
          ? { heroData: d.heroData as unknown as Prisma.InputJsonValue }
          : {}),
        ...(d.storyData !== undefined
          ? { storyData: d.storyData as unknown as Prisma.InputJsonValue }
          : {}),
        ...(d.policyTexts !== undefined
          ? { policyTexts: d.policyTexts as unknown as Prisma.InputJsonValue }
          : {}),
      },
    });

    const settings = await getPublicSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[PUT /api/admin/settings]", error);
    return NextResponse.json(
      { error: "Failed to save store settings." },
      { status: 500 }
    );
  }
}
