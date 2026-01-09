import dotenv from "dotenv";
dotenv.config();
import { Queue } from "bullmq";
export const queue = new Queue("jobs", {
    connection: {
        host: process.env.REDIS_HOST || "hopper.proxy.rlwy.net",
        port: parseInt(process.env.REDIS_PORT || "59602"),
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_TLS === "true" ? {} : undefined,
    },
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
    },
});
