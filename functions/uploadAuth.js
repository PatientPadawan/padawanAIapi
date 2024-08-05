import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import ImageKit from "imagekit";

const app = express();

// Configure CORS
const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

const imagekit = new ImageKit({
  urlEndpoint: process.env.IMAGE_KIT_ENDPOINT,
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
});

app.get('/.netlify/functions/uploadAuth', async (req, res) => {
  console.log("Handling GET request in uploadAuth");

  try {
    const result = imagekit.getAuthenticationParameters();
    console.log("Generated ImageKit authentication parameters");
    res.json(result);
  } catch (err) {
    console.error("Error in uploadAuth:", err);
    res.status(500).json({ error: "Error generating authentication parameters: " + err.message });
  }
});

export const handler = serverless(app);