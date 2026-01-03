import { prisma } from "../db/prisma.js";
export const createWebhook = async (req, res) => {
    try {
        const { url, events } = req.body;
        const user = req.user;
        const secret = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
        const webhook = await prisma.webhook.create({
            data: {
                url,
                events,
                secret,
                userId: user.id,
            },
        });
        if (!webhook) {
            return res
                .status(400)
                .json({ message: "Was not able to create webhook" });
        }
        else {
            return res
                .status(200)
                .json({ message: "Successfully created webhook", secret });
        }
    }
    catch (error) { }
};
export const recreateSecret = async (req, res) => {
    try {
        const user = req.user;
        const webhook = await prisma.webhook.findFirst({
            where: {
                userId: user.id,
            },
        });
        if (!webhook) {
            return res.status(400).json({ message: "Was not able to find webhook" });
        }
        else {
            const secret = Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
            await prisma.webhook.update({
                where: {
                    id: webhook.id,
                },
                data: {
                    secret,
                },
            });
            return res
                .status(200)
                .json({ message: "Successfully recreated webhook", secret });
        }
    }
    catch (error) { }
};
