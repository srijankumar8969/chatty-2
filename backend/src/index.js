import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

app.use(cookieParser());

app.use(express.json({
  limit: '50mb'
}));

app.set('trust proxy', 1);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

import { apiLimiter } from "./middleware/rateLimit.middleware.js";

app.use("/api/auth", authRoutes);
app.use("/api/messages", apiLimiter, messageRoutes);

app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({ message: 'Payload too large. Upload a smaller image or increase server JSON limit.' });
  }
  next(err);
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));


  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});