import { redisConnection } from "@/lib/redis";
import { Queue } from "bullmq";

export const exportQueue = new Queue("export-users", {
  connection: redisConnection,
});
