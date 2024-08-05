import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import mongoose from "mongoose";
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
        statusCode: 204,
        headers,
        body: "",
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
    if (event.httpMethod !== "GET") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const userId = event.auth.userId;

    try {
      await mongoose.connect(process.env.MONGO);

      const userChats = await UserChats.find({ userId });
      return {
        statusCode: 200,
        body: JSON.stringify(userChats[0].chats),
      };
    } catch (err) {
      console.log(err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Error fetching user chats!" }),
      };
    }
  })
);
