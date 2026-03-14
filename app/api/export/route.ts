import { exportQueue } from "@/app/queue/export-queue";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const filters = await req.json();
    const job = await db.export_job.create({
      data: {
        status: "INCOMPLETE",
        filters: filters,
      },
    });

    const queue = await exportQueue.add(
      "export",
      { jobId: job.id },
      { attempts: 3 },
    );

    return NextResponse.json(
      {
        jobId: job.id,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Failed to create export job", error);
    return NextResponse.json(
      {
        error: error,
        message: "Failed to create export job",
      },
      {
        status: 500,
      },
    );
  }
}
