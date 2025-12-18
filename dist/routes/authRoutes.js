import { Router } from "express";
import { login, signUp, verifyEmail } from "../controllers/authController.js";
const router = Router();
router.route("/signup").post(signUp);
router.route("/verify/:token").get(verifyEmail);
router.route("/login").post(login);
export default router;
