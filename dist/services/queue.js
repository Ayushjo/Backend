import dotenv from "dotenv";
dotenv.config();
// src/services/queue.ts
import Bull from "bull";
let queueInstance = null;
export const getQueue = () => {
    if (!queueInstance) {
        queueInstance = new Bull("taskflow-queue", {
            // ← Same name important
            redis: {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
            },
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: false,
            },
        });
    }
    return queueInstance;
};
export const queue = getQueue();
