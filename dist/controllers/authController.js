import { prisma } from "../db/prisma.js";
import { Resend } from "resend";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
export const signUp = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        const existingVerifiedUser = await prisma.user.findFirst({
            where: {
                email: email,
            },
        });
        if (existingVerifiedUser) {
            return res
                .status(400)
                .json({ message: "User already exists, please login" });
        }
        const hashedPassword = bcrypt.hashSync(password, 10);
        const user = await prisma.user.create({
            data: {
                name: name,
                email: email,
                hashedPassword: hashedPassword,
            },
        });
        const verificationToken = jwt.sign({
            id: user.id,
            email: user.email,
        }, process.env.JWT_SECRET);
        const hashedVerificationToken = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");
        const resend = new Resend(process.env.RESEND_EMAIL_API_KEY);
        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                hashedVerificationToken: hashedVerificationToken,
                verificationTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
            },
        });
        resend.emails.send({
            from: "ayushsingh202586@gmail.com",
            to: email,
            subject: "Verify your email",
            text: `Click on the link to verify your email: http://localhost:3000/verify-email/${verificationToken}`,
        });
        res
            .status(200)
            .json({ message: "Sent verification email", verificationToken });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await prisma.user.findFirst({
            where: {
                hashedVerificationToken: hashedToken,
                verificationTokenExpiry: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            return res
                .status(400)
                .json({ message: "Invalid token or expired token" });
        }
        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                verified: true,
                hashedVerificationToken: null,
                verificationTokenExpiry: null,
            },
        });
        res.status(200).json({ message: "Email verified" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        const user = await prisma.user.findFirst({
            where: {
                email: email,
            },
        });
        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }
        if (!user.verified) {
            const verificationToken = jwt.sign({
                id: user.id,
                email: user.email,
            }, process.env.JWT_SECRET);
            const hashedVerificationToken = crypto
                .createHash("sha256")
                .update(verificationToken)
                .digest("hex");
            const resend = new Resend(process.env.RESEND_EMAIL_API_KEY);
            await prisma.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    hashedVerificationToken: hashedVerificationToken,
                    verificationTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
                },
            });
            resend.emails.send({
                from: "ayushsingh202586@gmail.com",
                to: email,
                subject: "Verify your email",
                text: `Click on the link to verify your email: http://localhost:3000/verify-email/${verificationToken}`,
            });
            return res
                .status(400)
                .json({
                message: "Please verify your email, email has been sent again",
            });
        }
        const isPasswordCorrect = bcrypt.compareSync(password, user.hashedPassword);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Incorrect password" });
        }
        const token = jwt.sign({
            id: user.id,
            email: user.email,
        }, process.env.JWT_SECRET);
        res.status(200).json({ message: "Login successful", token });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};
