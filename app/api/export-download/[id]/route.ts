import path from "path";
import fs from "fs";
import { NextResponse } from "next/server";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const filePath = path.join(process.cwd(), "app/export", `export-${id}.csv`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ message: "File not ready" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="users-${id}.csv"`,
      },
    });
  } catch (error) {
    console.error("Download Failed", error);
    return Response.json({ error: "Failed to download file" }, { status: 500 });
  }
}
