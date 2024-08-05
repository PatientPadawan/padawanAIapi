import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import mongoose from "mongoose";
import UserChats from "../models/userChats.js";
import cors from "cors";
import serverless from "serverless-http";
import express from "express";

const app = express();

// Configure CORS
const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

let dbConnection = null;

const connectDB = async () => {
  if (!dbConnection) {
    dbConnection = await mongoose.connect(process.env.MONGO);
  }
  return dbConnection;
};

app.get("/", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;

  try {
    await connectDB();
    const userChats = await UserChats.find({ userId });
    res.json(userChats[0].chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching user chats!" });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

exports.handler = serverless(app);

console.log("getUserChats function loaded");

app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.path}`);
  next();
});
