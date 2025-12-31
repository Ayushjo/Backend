import { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { queue } from "../services/queue.js";

export const createJob = async (req: any, res: Response) => {
  try {
    const user = req.user;
    const {
      type,
      templateId,
      input,
      priority,
      scheduledFor,
      parentJobId,
      workflowId,
    } = req.body;

    if (parentJobId) {
      const parent = await prisma.job.findFirst({
        where: {
          id: parentJobId,
        },
      });
      if (parent && parent.priority > priority) {
        return res.status(400).json({
          message:
            "Parent job priority should be less than or equal to child job priority",
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
    const queueJob = await queue.add(
      job.type,
      {
        jobId: job.id,
        ...(typeof job.input === "object" && job.input !== null
          ? job.input
          : {}),
        parentJobId: parentJobId,
      },
      {
        priority: job.priority,
        delay: scheduledFor ? new Date(scheduledFor).getTime() - Date.now() : 0,
        attempts: job.maxAttempts,
        backoff: { type: "exponential", delay: 2000 },
      }
    );
    if (queueJob && queueJob.id) {
      await prisma.job.update({
        where: {
          id: job.id,
        },
        data: {
          queueJobId: parseInt(queueJob.id as string),
        },
      });
    }
    res.status(200).json({ job, message: "Job created successfully" });
  } catch (error: any) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getJobs = async (req: any, res: Response) => {
  try {
    const user = req.user;
    const jobs = await prisma.job.findMany({
      where: {
        userId: user.id,
      },
    });
    res.status(200).json({ jobs });
  } catch (error: any) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const cancelJob = async (req: Request, res: Response) => {
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
    const queueJob = await queue.removeJobs(job.queueJobId as any);
    if (queueJob as any) {
      await prisma.job.delete({
        where: {
          id: job.id,
        },
      });
    }
  } catch (error: any) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getJobById = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

export const editJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const {
      type,
      templateId,
      input,
      priority,
      scheduledFor,
      parentJobId,
      workflowId,
    } = req.body;
    const job = await prisma.job.update({
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
    if (!job) {
      return res.status(400).json({ message: "Job not found" });
    }
    res.status(200).json({ job, message: "Job updated successfully" });
  } catch (error: any) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};
