import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI);

let clientPromise;

async function connectToMongoDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  if (!clientPromise) {
    clientPromise = client.connect();
  }

  await clientPromise;

  return client.db("Togetherly");
}

// Home route
app.get("/", (req, res) => {
  res.json({ message: "Server is running fine" });
});

// Create event
app.post("/event/create", async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const result = await db.collection("createEvent").insertOne(req.body);

    res.status(201).json(result);
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
});

// Join event
app.post("/event/join", async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const result = await db.collection("joinEvent").insertOne(req.body);

    res.status(201).json(result);
  } catch (error) {
    console.error("Join event error:", error);
    res.status(500).json({ message: "Failed to join event" });
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
    res.status(500).json({ message: "Failed to fetch joined events" });
  }
});

// Get all events
app.get("/event", async (req, res) => {
  try {
    const db = await connectToMongoDB();

    const result = await db.collection("createEvent").find().toArray();

    res.status(200).json(result);
  } catch (error) {
    console.error("Fetch events error:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// Get event by ID
app.get("/event/:id", async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid Event ID",
      });
    }

    const result = await db
      .collection("createEvent")
      .findOne({ _id: new ObjectId(id) });

    if (!result) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Fetch event error:", error);
    res.status(500).json({
      message: "Failed to fetch event",
    });
  }
});

// Local development only
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export Express app for Vercel
export default app;
