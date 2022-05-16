const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;

//midleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bqdh1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// console.log(uri)

async function run() {
  try {
    await client.connect();
    const appointmentCollection = client
      .db("Doctors-Portal")
      .collection("appointments");
    const bookingCollection = client.db("Doctors-Portal").collection("booking");

    console.log("db connect");

    app.get("/appointments", async (req, res) => {
      const query = {};
      const cursor = appointmentCollection.find(query);
      const result = await cursor.toArray();
      // console.log(result)
      res.send(result);
    });
    // For new booking purpose
    app.post("/booking", async (req, res) => {
      const query = req.body;
      console.log(query);
      const result = await bookingCollection.insertOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello  Doctor Uncle!");
});

app.listen(port, () => {
  console.log(`Doctor app listening on port ${port}`);
});
