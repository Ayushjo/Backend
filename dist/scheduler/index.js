import { CronExpressionParser } from "cron-parser";
import { queue } from "../services/queue.js";
import { prisma } from "../db/prisma.js";
import cron from "node-cron";
cron.schedule("* * * * *", async () => {
    console.log("running a task every minute");
    const dueJobs = await prisma.scheduledJob.findMany({
        where: {
            nextRun: {
                lte: new Date(),
            },
            enabled: true,
        },
    });
    for (const scheduled of dueJobs) {
        const job = await prisma.job.create({
            data: {
                type: scheduled.jobType,
                input: scheduled.jobInput,
                userId: scheduled.userId,
            },
        });
        const queueJob = await queue.add(job.type, {
            jobId: job.id,
            ...(typeof job.input === "object" && job.input !== null
                ? job.input
                : {}),
            userId: job.userId,
            input: job.input,
        }, {
            priority: job.priority,
            attempts: job.maxAttempts,
            backoff: { type: "exponential", delay: 2000 },
        });
        await prisma.job.update({
            where: {
                id: job.id,
            },
            data: {
                queueJobId: queueJob.id,
                status: "PENDING",
            },
        });
        const cron = CronExpressionParser.parse(scheduled.cronExpression);
        const decodedCron = await prisma.scheduledJob.update({
            where: {
                id: scheduled.id,
            },
            data: {
                lastJobId: job.id,
                lastRun: new Date(),
                nextRun: new Date(new Date().getTime() + cron.next().getTime()),
            },
        });
    }
});
