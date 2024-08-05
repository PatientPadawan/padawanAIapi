import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import mongoose from "mongoose";
import Chat from "../models/chat.js";
import UserChats from "../models/userChats.js";

const corsWrapper = (handler) => {
  return async (event, context) => {
    const headers = {
      "Access-Control-Allow-Origin": process.env.CLIENT_URL,
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      "Access-Control-Allow-Credentials": "true",
    };

    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers,
      };
    }

    const response = await handler(event, context);
    return {
      ...response,
      headers: { ...response.headers, ...headers },
    };
  };
};

exports.handler = corsWrapper(
  ClerkExpressRequireAuth()(async (event, context) => {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const userId = event.auth.userId;
    const { text } = JSON.parse(event.body);

    try {
      await mongoose.connect(process.env.MONGO);

      const newChat = new Chat({
        userId: userId,
        history: [{ role: "user", parts: [{ text }] }],
      });
      const savedChat = await newChat.save();

      const userChats = await UserChats.find({ userId: userId });

      if (!userChats.length) {
        const newUserChats = new UserChats({
          userId: userId,
          chats: [
            {
              _id: savedChat.id,
              title: text.substring(0, 40),
            },
          ],
        });
        await newUserChats.save();
      } else {
        await UserChats.updateOne(
          { userId: userId },
          {
            $push: {
              chats: {
                _id: savedChat._id,
                title: text.substring(0, 40),
              },
            },
          }
        );
      }

      return {
        statusCode: 201,
        body: JSON.stringify({ id: savedChat._id }),
      };
    } catch (err) {
      console.log(err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Error creating chat!" }),
      };
    }
  })
);
