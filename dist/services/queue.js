import dotenv from "dotenv";
dotenv.config();
import { Queue } from "bullmq";
export const queue = new Queue("jobs", {
    connection: {
        host: "redis-b_rl.railway.internal",
        port: 6379,
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
    },
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
    },
});
