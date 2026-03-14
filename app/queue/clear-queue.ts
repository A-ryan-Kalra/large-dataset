import { exportQueue } from "./export-queue";

async function clearQueue() {
  await exportQueue.obliterate({ force: true });
  console.log("Queue cleared");
  process.exit(0);
}

clearQueue();
