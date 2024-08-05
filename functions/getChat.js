import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import mongoose from "mongoose";
import Chat from "../models/chat.js";

const app = express();

// Configure CORS
const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
};

app.use(cors(corsOptions));

app.get('/.netlify/functions/getChat/:chatId', ClerkExpressRequireAuth(), async (req, res) => {
  console.log("Handling GET request in getChat");
  const userId = req.auth.userId;
  const chatId = req.params.chatId;
  console.log(`User ID: ${userId}, Chat ID: ${chatId}`);

  try {
    console.log("Connecting to MongoDB");
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB");

    console.log("Fetching chat");
    const chat = await Chat.findOne({ _id: chatId, userId });
    console.log(`Found chat: ${chat ? 'Yes' : 'No'}`);

    if (chat) {
      res.json(chat);
    } else {
      res.status(404).json({ error: "Chat not found" });
    }
  } catch (err) {
    console.error("Error in getChat:", err);
    res.status(500).json({ error: "Error fetching chat: " + err.message });
  }
});

export const handler = serverless(app);