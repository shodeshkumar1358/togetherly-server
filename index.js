import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Configuration
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing from environment variables");
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  maxPoolSize: 10,
});

// Cache MongoDB connection
let clientPromise;

async function connectToMongoDB() {
  if (!clientPromise) {
    clientPromise = client.connect().catch((error) => {
      clientPromise = null;
      console.error("MongoDB Connection Error:", error);
      throw error;
    });
  }

  await clientPromise;

  console.log("MongoDB Connected Successfully!");

  return client.db("Togetherly");
}

// Home route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running fine",
  });
});

// Create event
app.post("/event/create", async (req, res) => {
  try {
    const db = await connectToMongoDB();

    const result = await db.collection("createEvent").insertOne(req.body);

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Create event error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create event",
    });
  }
});

// Join event
app.post("/event/join", async (req, res) => {
  try {
    const db = await connectToMongoDB();

    const result = await db.collection("joinEvent").insertOne(req.body);

    res.status(201).json({
      success: true,
      message: "Joined event successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Join event error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to join event",
    });
  }
});

// Get joined events by email
app.get("/event/join/:userEmail", async (req, res) => {
  try {
    const db = await connectToMongoDB();

    const { userEmail } = req.params;

    const result = await db
      .collection("joinEvent")
      .find({ email: userEmail })
      .toArray();

    res.status(200).json(result);
  } catch (error) {
    console.error("Fetch joined events error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch joined events",
    });
  }
});

// Get all events
app.get("/event", async (req, res) => {
  try {
    const db = await connectToMongoDB();

    const result = await db.collection("createEvent").find({}).toArray();

    res.status(200).json(result);
  } catch (error) {
    console.error("Fetch events error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
});

// Get event by ID
app.get("/event/:id", async (req, res) => {
  try {
    const db = await connectToMongoDB();

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Event ID",
      });
    }

    const result = await db.collection("createEvent").findOne({
      _id: new ObjectId(id),
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Fetch event error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
    });
  }
});

// Local development
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Vercel deployment
export default app;
 