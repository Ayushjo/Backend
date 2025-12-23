import dotenv from "dotenv";
dotenv.config();
import morgan from "morgan";
import express from "express";
import logger from "./logger.js";
const app = express();
const morganFormat = ":method :url :status :response-time ms";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };

        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

app.use(express.json());
//Pre Req Handler
app.use((req, res, next) => {
  console.log(`\n=== REQUEST DEBUG ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Origin: ${req.headers.origin}`);
  console.log(`Content-Type: ${req.headers["content-type"]}`);
  console.log(`Cookie header: ${req.headers.cookie}`);
  console.log(`Authorization header: ${req.headers.authorization}`);
  console.log("=== END REQUEST DEBUG ===\n");

  if (req.method === "OPTIONS") {
    console.log("🔄 Handling OPTIONS preflight request");
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,Cookie"
    );
    res.header("Access-Control-Max-Age", "86400"); // 24 hours
    console.log("✅ OPTIONS response headers set");
    return res.status(200).end();
  }

  next();
});

const PORT = process.env.PORT || 3500;

import userRouter from "./routes/authRoutes.js";

app.use("/api/v0/user", userRouter);

import jobRouter from "./routes/jobRoutes.js";

app.use("/api/v0/job", jobRouter);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
