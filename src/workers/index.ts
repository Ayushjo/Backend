import dotenv from "dotenv";
dotenv.config();

import { queue } from "../services/queue.js";
import { prisma } from "../db/prisma.js";
// Top of worker file
console.log("Redis:", process.env.REDIS_HOST, process.env.REDIS_PORT);
console.log("🚀 Worker starting...");
queue.process("*",5, async (job: any) => {
  console.log(`Processing ${job.id}:${job.type}`);
  if (job.data.parentJobId) {
    const parent = await prisma.job.findFirst({
      where: {
        id: job.parentJobId,
      },
    });
    if (parent && parent.status !== "COMPLETED") {
      throw new Error("Waiting for parent job");
    }
  }
  try {
    await prisma.job.update({
      where: {
        id: job.data.jobId,
      },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
      },
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });
    const result = { message: `Processed ${job.id}:${job.type} ${job.input}` };

    await prisma.job.update({
      where: {
        id: job.data.jobId,
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        output: result,
        processingTime: Date.now() - new Date(job.startedAt).getTime(),
      },
    });
    console.log(`${job.id}:${job.type} completed`);
    return result;
  } catch (error: any) {
    await prisma.job.update({
      where: {
        id: job.data.jobId,
      },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        error: error.message,
        attempts: { increment: 1 },
      },
    });
  }
});
console.log("✅ Worker ready, listening for jobs...");
