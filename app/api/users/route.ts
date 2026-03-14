import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("move");
  const cursor = Number(searchParams.get("cursor"));
  const pageSize = Number(searchParams.get("size") ?? 10);

  let users;
  if (direction === "next") {
    users = await db.user.findMany({
      take: pageSize + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { id: "asc" },
    });
  } else if (direction === "prev") {
    users = await db.user.findMany({
      where: {
        id: {
          lte: cursor,
        },
      },
      orderBy: { id: "desc" },
      take: pageSize,
    });
    users.reverse();
  } else {
    users = await db.user.findMany({
      take: pageSize + 1,
      ...(cursor && {
        cursor: { id: cursor },
        // skip: 1,
      }),
      orderBy: { id: "asc" },
    });
  }

  let nextCursor = null,
    nextItem;

  if (
    (users.length > pageSize && direction === "next") ||
    direction === "pageSize"
  ) {
    nextItem = users?.pop();
    nextCursor = nextItem?.id;
  } else {
    nextCursor = users[0].id;
  }

  return NextResponse.json({ data: users, nextCursor });
}
