import { db } from "@/lib/db";
import { redisConnection } from "@/lib/redis";
import { Worker } from "bullmq";
import fs from "fs";
import path from "path";

const BATCH_SIZE = 1000;

const worker = new Worker(
  "export-users",
  async (job) => {
    console.log("Worker is running...");

    const { jobId } = job.data;
    console.log("jobId", jobId);

    let stream: fs.WriteStream | null = null;

    try {
      const exportJob = await db.export_job.findUnique({
        where: {
          id: jobId,
        },
      });

      if (!exportJob) throw new Error("Job not found");

      let cursor = exportJob.last_exported_id ?? 0;

      const exportDir = path.join(process.cwd(), "app/export");

      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const filePath = path.join(exportDir, `export-${jobId}.csv`);
      console.log("filePath", filePath);

      stream = fs.createWriteStream(filePath, { flags: "a" });

      while (true) {
        const users: {
          id: number;
          first_name: string;
          last_name: string;
          email: string;
          country: string;
          created_at: Date;
        }[] = await db.$queryRaw`
        SELECT
        id,
        first_name,
        last_name,
        email,
        country
        FROM "user"
        WHERE id > ${cursor}
        ORDER BY id ASC
        LIMIT ${BATCH_SIZE}
        `;

        if (users.length === 0) {
          break;
        }

        let lastIdInBatch = cursor;
        let row = "id,first_name,last_name,email,country,created_at\n";
        stream.write(row);
        for (const user of users) {
          row = `${user.id},${user.first_name},${user.last_name},${user.email},${user.country},${user.created_at}\n`;

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
    // concurrency: 2,
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed: `, err);
});
