import express from "express";
import { MongoClient } from "mongodb";
import "dotenv/config";
import cors from "cors";
import { ObjectId } from "mongodb";

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const mongoClient = await connectToMongoDB();
const db = mongoClient.db("Togetherly");
const evenCollection = db.collection("createEvent");
const joinCollection = db.collection("joinEvent");

app.post("/event/create", (req, res) => {
  const data = req.body;
  const result = evenCollection.insertOne(data);
  console.log(result);
  res.send(result);
});

app.post("/event/join", (req, res) => {
  const data = req.body;
  const result = joinCollection.insertOne(data);
  console.log(result);
  res.send(result);
});

app.get("/event/join/:userEmail", async (req, res) => {
  const { userEmail } = req.params;
  const result = await joinCollection.find({ email: userEmail }).toArray();
  res.send(result);
});

app.get("/event", async (req, res) => {
  const result = await evenCollection.find().toArray();
  res.send(result);
});

app.get("/event/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid Event ID",
      });
    }

    const result = await evenCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!result) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch event",
    });
  }
});

// http://localhost:5000/event/join
app.get("/", (req, res) => {
  res.send({ message: "Server is running fine" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
