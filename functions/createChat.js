import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import mongoose from "mongoose";
import Chat from "../models/chat.js";
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

// Add this line to parse JSON body
app.use(express.json());

// Add debug logging
app.use((req, res, next) => {
  console.log('Request headers:', req.headers);
  res.on('finish', () => {
    console.log('Response headers:', res.getHeaders());
  });
  next();
});

app.post('/.netlify/functions/createChat', ClerkExpressRequireAuth(), async (req, res) => {
  console.log("Handling POST request in createChat");
  const userId = req.auth.userId;
  console.log(`User ID: ${userId}`);

  const { text } = req.body;
  console.log("Received text:", text);

  try {
    console.log("Connecting to MongoDB");
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB");

    console.log("Creating new chat with text:", text);
    const newChat = new Chat({
      userId: userId,
      history: [{ role: "user", parts: [{ text: text || "" }] }],
    });
    const savedChat = await newChat.save();
    console.log(`Created new chat with ID: ${savedChat._id}`);

    console.log("Updating UserChats");
    const userChats = await UserChats.find({ userId: userId });

    if (userChats.length === 0) {
      const newUserChats = new UserChats({
        userId: userId,
        chats: [
          {
            _id: savedChat._id,
            title: text ? text.substring(0, 40) : "New Chat",
          },
        ],
      });
      await newUserChats.save();
      console.log("Created new UserChats document");
    } else {
      await UserChats.updateOne(
        { userId: userId },
        {
          $push: {
            chats: {
              _id: savedChat._id,
              title: text ? text.substring(0, 40) : "New Chat",
            },
          },
        }
      );
      console.log("Updated existing UserChats document");
    }

    res.status(201).json({ id: savedChat._id });
  } catch (err) {
    console.error("Error in createChat:", err);
    res.status(500).json({ error: "Error creating chat: " + err.message });
  }
});

export const handler = serverless(app);