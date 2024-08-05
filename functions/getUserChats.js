import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import mongoose from "mongoose";
import UserChats from "../models/userChats.js";
import cors from 'cors';
import serverless from 'serverless-http';
import express from 'express';

const app = express();

console.log("Initializing getUserChats function");

// Configure CORS
const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.path}`);
  next();
});

app.get('/', ClerkExpressRequireAuth(), async (req, res) => {
  console.log("Handling GET request in getUserChats");
  const userId = req.auth.userId;
  console.log(`User ID: ${userId}`);

  try {
    console.log("Connecting to MongoDB");
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB");

    console.log("Fetching user chats");
    const userChats = await UserChats.find({ userId });
    console.log(`Found ${userChats.length} user chats`);

    if (userChats.length > 0 && userChats[0].chats) {
      res.json(userChats[0].chats);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error("Error in getUserChats:", err);
    res.status(500).json({ error: "Error fetching user chats!" });
  }
});

app.use((err, req, res, next) => {
  console.error("Error in getUserChats middleware:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

console.log("Setting up serverless handler");
const handler = serverless(app);

exports.handler = async (event, context) => {
  console.log("Handler invoked with event:", JSON.stringify(event));
  const result = await handler(event, context);
  console.log("Handler result:", JSON.stringify(result));
  return result;
};

console.log("getUserChats function setup complete");