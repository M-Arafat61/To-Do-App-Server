const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
var jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      "https://task-management-9ebf5.web.app/",
      "https://task-management-9ebf5.firebaseapp.com/",
      // "http://localhost:5173"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8ni3cgn.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const userCollection = client.db("Task-Management").collection("users");
    const taskCollection = client.db("Task-Management").collection("tasks");

    app.post("/auth/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_ACCESS, {
        expiresIn: "2h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          // secure: false,
          // sameSite: "strict",
        })
        .send({ success: true });
    });

    app.post("/auth/logout", async (req, res) => {
      const user = req.body;
      //   console.log("logged out user", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const isExists = await userCollection.findOne(query);
      if (isExists) {
        return res.send({ status: "user already exists" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.post("/tasks", async (req, res) => {
      const tasks = req.body;
      const result = await taskCollection.insertOne(tasks);
      res.send(result);
    });
    app.get("/tasks", async (req, res) => {
      const result = await taskCollection.find().toArray();
      res.send(result);
    });

    app.delete("/deleteTask/:taskId", async (req, res) => {
      const id = req.params.taskId;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/tasks/:taskId", async (req, res) => {
      const id = req.params.taskId;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedTask = req.body;

      const updateDoc = {
        $set: {
          status: updatedTask.status,
        },
      };

      const result = await taskCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
    app.patch("/updateTasks/:taskId", async (req, res) => {
      const id = req.params.taskId;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedTask = req.body;
      const updateDoc = {
        $set: {
          title: updatedTask.title,
          description: updatedTask.description,
          priority: updatedTask.priority,
          deadline: updatedTask.deadline,
          status: updatedTask.status,
          postCreatedAt: new Date(),
        },
      };

      const result = await taskCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("task management server!");
});

app.listen(port, () => {
  console.log(`task management server listening on port ${port}`);
});
