import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import mongoose from "mongoose";
import UserChats from "../models/userChats.js";

exports.handler = ClerkExpressRequireAuth()(async (event, context) => {
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
});
