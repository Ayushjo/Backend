import dotenv from "dotenv";
dotenv.config();

import { queue } from "../services/queue.js";
import { prisma } from "../db/prisma.js";

console.log("🚀 Worker starting...");
queue.process("*", 5, async (job: any) => {
  console.log(`Processing ${job.id}:${job.data.type}`);

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
    if (job.data.parentJobId) {
      const parent = await prisma.job.findFirst({
        where: {
          id: job.parentJobId,
        },
      });
      if (parent && parent.status !== "COMPLETED") {
        await prisma.job.update({
          where: {
            id: job.data.jobId,
          },
          data: {
            status: "FAILED",
            error: "Waiting for parent job",
            attempts: { increment: 1 },
          },
        });
        throw new Error("Waiting for parent job");
      }
    }

    await new Promise((resolve) => {
      console.log("Started Working");

      setTimeout(resolve, 10000);
    });
    const result = {
      message: `Processed ${job.data.jobId}:${job.data.type} ${job.data.input}`,
    };

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
    console.log(`${job.id}:${job} completed`);
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
