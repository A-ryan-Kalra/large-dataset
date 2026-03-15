import { db } from "@/lib/db";
import { redisConnection } from "@/lib/redis";
import { Worker } from "bullmq";
import fs from "fs";
import path from "path";

// Read 1000 rows at a time
const BATCH_SIZE = 1000;
type ExportFilters = {
  country?: string;
  cursor?: number;
  email?: string;
  columns?: string[];
};

const worker = new Worker(
  "export-users",
  async (job) => {
    console.log("Worker is running...");

    const { jobId } = job.data;

    let stream: fs.WriteStream | null = null;

    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let index = 2;

      const exportJob = await db.export_job.findUnique({
        where: {
          id: jobId,
        },
      });
      const filters = exportJob?.filters as ExportFilters;
      if (filters?.country) {
        conditions.push(`country = $${index}`);
        values.push(filters.country);
        index++;
      }

      if (filters?.email) {
        conditions.push(`email ILIKE $${index}`);
        values.push(`%${filters.email}%`);
        index++;
      }

      let selectColumns = filters.columns?.join(",");
      console.log("selectColumns", selectColumns);

      const whereFilters =
        conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

      if (!exportJob) throw new Error("Job not found");

      let cursor = exportJob.last_exported_id ?? 0;

      const exportDir = path.join(process.cwd(), "app/export");

      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const filePath = path.join(exportDir, `export-${jobId}.csv`);

      const fileExists = fs.existsSync(filePath);

      stream = fs.createWriteStream(filePath, { flags: "a" });

      if (!fileExists) {
        stream.write(`${selectColumns}\n`);
      }

      // stream = fs.createWriteStream(filePath, { flags: "a" });

      let row;
      // stream.write(row);

      while (true) {
        const query = `
SELECT
${selectColumns}
FROM "user"
WHERE id > $1
${whereFilters}
ORDER BY id ASC
LIMIT ${BATCH_SIZE}
`;

        const users: {
          id: number;
          first_name: string;
          last_name: string;
          email: string;
          country: string;
          created_at: Date;
        }[] = await db.$queryRawUnsafe(query, cursor, ...values);

        if (users.length === 0) {
          break;
        }

        let lastIdInBatch = cursor;

        for (const user of users) {
          const row = `${filters.columns
            ?.map((col) => {
              if (col === "created_at") {
                const value = (user as any)[col];
                if (!value) return "";

                return new Date(value).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Kolkata",
                });
              }

              return (user as any)[col] ?? "";
            })
            .join(",")}\n`;

          stream.write(row);
          lastIdInBatch = user.id;
        }
        cursor = lastIdInBatch;

        await db.export_job.update({
          where: { id: jobId },
          data: {
            last_exported_id: cursor,
          },
        });
      }

      stream.close();

      await db.export_job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETE",
        },
      });
    } catch (error) {
      console.error("Export failed:", error);

      if (stream) stream.close();

      await db.export_job.update({
        where: { id: jobId },
        data: {
          status: "FAIL",
        },
      });

      throw error;
    }
  },
  {
    connection: redisConnection,
    lockDuration: 60000, // 1 minute
    maxStalledCount: 5,
    // concurrency: 2,
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed: `, err);
});
