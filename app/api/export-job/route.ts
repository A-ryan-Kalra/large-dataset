import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const direction = searchParams.get("move");
    const cursor = Number(searchParams.get("cursor"));
    const pageSize = Number(searchParams.get("size") ?? 10);

    let data;

    /* Show next page */
    if (direction === "next") {
      data = await db.export_job.findMany({
        take: pageSize + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: { created_at: "desc" },
      });
      /*  Show prev page */
    } else if (direction === "prev") {
      data = await db.export_job.findMany({
        where: {
          id: {
            lte: cursor,
          },
        },
        orderBy: { created_at: "asc" },
        take: pageSize,
      });

      data.reverse();
      /* Update pageSize */
    } else {
      data = await db.export_job.findMany({
        take: pageSize + 1,
        ...(cursor && {
          cursor: { id: cursor },
          // skip: 1,
        }),
        orderBy: { created_at: "desc" },
      });
    }

    let nextCursor = null,
      nextItem;

    if (
      (data.length > pageSize && direction === "next") ||
      direction === "pageSize"
    ) {
      nextItem = data?.pop();
      nextCursor = nextItem?.id;
    }
    if (direction === "prev") {
      nextCursor = data[0].id;
    }

    return NextResponse.json({ data, nextCursor, message: "Success" });
  } catch (error) {
    console.error("Failed to load users data");
    return NextResponse.json(
      {
        error: error,
        message: "Failed to load users data",
      },
      { status: 500 },
    );
  }
}
