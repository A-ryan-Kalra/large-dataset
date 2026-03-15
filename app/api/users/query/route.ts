import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // console.log("searchParams", searchParams);
    // const cursor = searchParams.get("cursor");
    const pageSize = searchParams.get("size");
    const page = searchParams.get("page");
    const country = searchParams.get("country");

    const query = `
  SELECT
    id,
    first_name,
    last_name,
    email,
    country,created_at
  FROM "user"
  WHERE country = $1
  ORDER BY id ASC
  OFFSET ($2 - 1) * $3
  LIMIT $3
`;

    const data = await db.$queryRawUnsafe(query, country, page, pageSize);

    return NextResponse.json({
      data,
    });
  } catch (error) {
    console.error("Failed to list users data");
    return NextResponse.json({
      message: "Failed to filter users data",
    });
  }
}
