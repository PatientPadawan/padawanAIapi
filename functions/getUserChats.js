import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import mongoose from "mongoose";
import UserChats from "../models/userChats.js";

const corsWrapper = (handler) => {
  return async (event, context) => {
    const headers = {
      "Access-Control-Allow-Origin": process.env.CLIENT_URL,
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
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

exports.handler = corsWrapper(async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": process.env.CLIENT_URL,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      },
    };
  }

  try {
    // Perform Clerk authentication here
    const clerkAuth = ClerkExpressRequireAuth();
    await new Promise((resolve, reject) => {
      clerkAuth(event, context, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (event.httpMethod !== "GET") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const userId = event.auth.userId;

    await mongoose.connect(process.env.MONGO);

    const userChats = await UserChats.find({ userId });
    return {
      statusCode: 200,
      body: JSON.stringify(userChats[0].chats),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ error: err.message || "Error fetching user chats!" }),
    };
  }
});