import dotenv from "dotenv";
dotenv.config();
import { Queue } from "bullmq";
export const queue = new Queue("jobs", {
    connection: process.env.REDIS_URL,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
    },
});
