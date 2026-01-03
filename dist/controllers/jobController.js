import { prisma } from "../db/prisma.js";
import { queue } from "../services/queue.js";
export const createJob = async (req, res) => {
    try {
        const user = req.user;
        const { type, templateId, input, priority, scheduledFor, parentJobId, workflowId, } = req.body;
        if (parentJobId) {
            const parent = await prisma.job.findFirst({
                where: {
                    id: parentJobId,
                },
            });
            if (parent && parent.priority > priority) {
                return res.status(400).json({
                    message: "Parent job priority should be less than or equal to child job priority",
                });
            }
        }
        const job = await prisma.job.create({
            data: {
                type,
                templateId,
                input,
                priority,
                scheduledFor,
                parentJobId,
                workflowId,
                userId: user.id,
            },
        });
        if (!job) {
            return res.status(400).json({ message: "Job not created" });
        }
        const queueJob = await queue.add(job.type, {
            jobId: job.id,
            ...(typeof job.input === "object" && job.input !== null
                ? job.input
                : {}),
            parentJobId: parentJobId,
            userId: user.id,
            input: job.input,
        }, {
            priority: job.priority,
            delay: scheduledFor ? new Date(scheduledFor).getTime() - Date.now() : 0,
            attempts: job.maxAttempts,
            backoff: { type: "exponential", delay: 2000 },
        });
        if (queueJob && queueJob.id) {
            await prisma.job.update({
                where: {
                    id: job.id,
                },
                data: {
                    queueJobId: parseInt(queueJob.id),
                },
            });
        }
        res.status(200).json({ job, message: "Job created successfully" });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};
export const getJobs = async (req, res) => {
    try {
        const user = req.user;
        const jobs = await prisma.job.findMany({
            where: {
                userId: user.id,
            },
        });
        res.status(200).json({ jobs });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};
export const cancelJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await prisma.job.findFirst({
            where: {
                id: jobId,
            },
        });
        if (!job) {
            return res.status(400).json({ message: "Job not found" });
        }
        if (job.status !== "PENDING") {
            return res.status(400).json({ message: "Job is already started" });
        }
        const queueJob = await queue.getJob(job.queueJobId?.toString());
        if (queueJob) {
            await queueJob?.remove();
            await prisma.job.update({
                where: {
                    id: job.id,
                },
                data: {
                    status: "CANCELLED",
                },
            });
        }
        return res.status(200).json({ message: "Job cancelled successfully" });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};
export const getJobById = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await prisma.job.findFirst({
            where: {
                id: jobId,
            },
        });
        if (!job) {
            return res.status(400).json({ message: "Job not found" });
        }
        res.status(200).json({ job });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};
export const editJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { type, templateId, input, priority, scheduledFor, parentJobId, workflowId, } = req.body;
        if (parentJobId) {
            const parent = await prisma.job.findFirst({
                where: {
                    id: parentJobId,
                },
            });
            if (parent && parent.priority > priority) {
                return res.status(400).json({
                    message: "Parent job priority should be less than or equal to child job priority",
                });
            }
        }
        const job = await prisma.job.findFirst({
            where: {
                id: jobId,
            },
        });
        if (!job) {
            return res.status(400).json({ message: "Job not found" });
        }
        if (job && job.status !== "PENDING") {
            return res.status(400).json({ message: "Job is already started" });
        }
        const queueJob = await queue.getJob(job.queueJobId?.toString());
        if (queueJob) {
            await queueJob?.remove();
        }
        const jobn = await prisma.job.update({
            where: {
                id: jobId,
            },
            data: {
                type,
                templateId,
                input,
                priority,
                scheduledFor,
                parentJobId,
                workflowId,
            },
        });
        const queueJob2 = await queue.add(jobn.type, {
            jobId: jobn.id,
            ...(typeof jobn.input === "object" && jobn.input !== null
                ? jobn.input
                : {}),
            parentJobId: parentJobId,
        }, {
            priority: jobn.priority,
            delay: scheduledFor ? new Date(scheduledFor).getTime() - Date.now() : 0,
            attempts: jobn.maxAttempts,
            backoff: { type: "exponential", delay: 2000 },
        });
        await prisma.job.update({
            where: {
                id: jobn.id,
            },
            data: {
                queueJobId: parseInt(queueJob2.id),
            },
        });
        res.status(200).json({ job, message: "Job updated successfully" });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};
