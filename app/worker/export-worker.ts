import { db } from "@/lib/db";
import { redisConnection } from "@/lib/redis";
import { Worker } from "bullmq";
import fs from "fs";
import path from "path";
import { finished } from "stream/promises";

// Read 1000 rows at a time
const BATCH_SIZE = 1000;
type ExportFilters = {
  country?: string;
  cursor?: number;
  email?: string;
  columns?: string[];
};

type UserType = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  created_at: Date;
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
        where: { id: jobId },
      });

      if (!exportJob) {
        throw new Error(`Export job ${jobId} not found`);
      }

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

      const columns = filters?.columns?.length
        ? filters.columns
        : ["id", "first_name", "last_name", "email", "country", "created_at"];

      const selectColumns = columns.join(",");
      console.log("selectColumns", selectColumns);

      const whereFilters =
        conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

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

      let row;
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

        const users: UserType[] = await db.$queryRawUnsafe(
          query,
          cursor,
          ...values,
        );

        await new Promise((resolve) => setTimeout(resolve, 0));
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

      if (stream) {
        stream.end();
        await finished(stream); // This is cleaner and more reliable
      }
      await db.export_job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETE",
        },
      });
      return { message: "success" };
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
    concurrency: 2,
    lockDuration: 300000, // 5 minutes — adjust to > max expected batch time
    lockRenewTime: 10000, // renew every 10s (default is lockDuration/4-ish)
    maxStalledCount: 3, // or higher
  },
);

worker.on("active", async (job) => {
  console.log("Started job:", job.id);
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed: `, err);
});

worker.on("stalled", (jobId) => {
  console.warn(`Job ${jobId} stalled`);
});
