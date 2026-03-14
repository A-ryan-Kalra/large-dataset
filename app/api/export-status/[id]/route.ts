import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = await params;

  try {
    const job = await db.export_job.findUnique({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      job,
    });
  } catch (error) {
    console.error("Failed to fetch export jobs");
    return NextResponse.json(
      {
        message: "Failed to fetch export jobs",
      },
      {
        status: 500,
      },
    );
  }
}
