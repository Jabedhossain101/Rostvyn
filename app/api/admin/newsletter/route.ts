import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

function escapeCsv(val: string): string {
  if (/[",\n\r]/.test(val)) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { subscribedAt: "desc" },
    });

    const format = request.nextUrl.searchParams.get("format");
    if (format === "csv") {
      const header = "email,source,subscribedAt";
      const rows = subscribers.map((s) =>
        [
          escapeCsv(s.email),
          escapeCsv(s.source),
          escapeCsv(s.subscribedAt.toISOString()),
        ].join(",")
      );
      const csv = [header, ...rows].join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="rostvyn-subscribers-${new Date()
            .toISOString()
            .slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      subscribers: subscribers.map((s) => ({
        id: s.id,
        email: s.email,
        source: s.source,
        subscribedAt: s.subscribedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/newsletter]", error);
    return NextResponse.json(
      { error: "Failed to load newsletter subscribers." },
      { status: 500 }
    );
  }
}
