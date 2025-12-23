import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
export const extractUserDetails = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;
    if (!decodedToken || !decodedToken.id) {
      res.status(401).json({ message: "Unauthorized" });
    }
    const user = await prisma.user.findFirst({
      where: {
        id: decodedToken.id,
        verified: true,
      },
    });
    req.user = user;
    next();
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
