import dotenv from "dotenv";
dotenv.config();
import { Queue } from "bullmq";
export const queue = new Queue("jobs", {
    connection: {
        host: "hopper.proxy.rlwy.net",
        port: 59602,
        username: "default",
        password: process.env.REDIS_PASSWORD,
        tls: {
            rejectUnauthorized: false,
        },
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
    },
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
    },
});
