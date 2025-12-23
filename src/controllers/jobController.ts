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
    await queue.add(job.type, {
      jobId: job.id,
      ...(typeof job.input === "object" && job.input !== null ? job.input : {}),
      parentJobId:parentJobId
    },
    {
      priority:job.priority,
      delay:scheduledFor?new Date(scheduledFor).getTime() - Date.now() :0,
      attempts:job.maxAttempts,
      backoff:{type:"exponential", delay:2000}
    }
  );
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
    await prisma.job.delete({
      where: {
        id: jobId,
      },
    });
    res.status(200).json({ message: "Job cancelled successfully" });
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
