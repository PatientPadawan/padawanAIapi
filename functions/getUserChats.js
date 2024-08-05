import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import mongoose from "mongoose";
import UserChatsModule from "../models/userChats.js";

const UserChats = UserChatsModule.default || UserChatsModule;

const app = express();

// Configure CORS
const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.get('/.netlify/functions/getUserChats', ClerkExpressRequireAuth(), async (req, res) => {
  console.log("Handling GET request in getUserChats");
  const userId = req.auth.userId;
  console.log(`User ID: ${userId}`);

  try {
    console.log("Connecting to MongoDB");
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB");

    console.log("Fetching user chats");
    console.log("UserChats model:", UserChats);
    if (typeof UserChats.find !== 'function') {
      throw new Error('UserChats.find is not a function');
    }
    const userChats = await UserChats.find({ userId });
    console.log(`Found ${userChats.length} user chats`);

    if (userChats.length > 0 && userChats[0].chats) {
      res.json(userChats[0].chats);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error("Error in getUserChats:", err);
    res.status(500).json({ error: "Error fetching user chats: " + err.message });
  }
});

export const handler = serverless(app);