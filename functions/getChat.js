import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import mongoose from "mongoose";
import Chat from "../models/chat.js";

exports.handler = ClerkExpressRequireAuth()(async (event, context) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const userId = event.auth.userId;
  const chatId = event.path.split("/").pop();

  try {
    await mongoose.connect(process.env.MONGO);

    const chat = await Chat.findOne({ _id: chatId, userId });
    return {
      statusCode: 200,
      body: JSON.stringify(chat),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error fetching chat!" }),
    };
  }
});
