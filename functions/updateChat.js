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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Add this line to handle preflight requests
app.options('*', cors(corsOptions));

app.put('/.netlify/functions/updateChat/:chatId', ClerkExpressRequireAuth(), async (req, res) => {
  console.log("Handling PUT request in updateChat");
  const userId = req.auth.userId;
  const chatId = req.params.chatId;
  const { question, answer, img } = req.body;
  console.log(`User ID: ${userId}, Chat ID: ${chatId}`);

  const newItems = [
    ...(question
      ? [{ role: "user", parts: [{ text: question }], ...(img && { img }) }]
      : []),
    { role: "model", parts: [{ text: answer }] },
  ];

  try {
    console.log("Connecting to MongoDB");
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB");

    console.log("Updating chat");
    const updatedChat = await Chat.updateOne(
      { _id: chatId, userId },
      {
        $push: {
          history: {
            $each: newItems,
          },
        },
      }
    );
    console.log("Chat updated");

    res.json(updatedChat);
  } catch (err) {
    console.error("Error in updateChat:", err);
    res.status(500).json({ error: "Error updating chat: " + err.message });
  }
});

export const handler = serverless(app);