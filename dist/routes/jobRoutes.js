import { Router } from "express";
import { extractUserDetails } from "../middlewares/extractUserDetails.js";
import { createJob } from "../controllers/jobController.js";
const router = Router();
router.route("/create-job").post(extractUserDetails, createJob);
export default router;
