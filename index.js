const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
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
/* function jwtVeryfi(res, req, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorize access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, "process.env.ACCESS_TOKEN_SECRET", function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbiden access" });
    }
    req.decoded = decoded;
    next();
  });
} */

async function run() {
  try {
    await client.connect();
    const appointmentCollection = client
      .db("Doctors-Portal")
      .collection("appointments");
    const bookingCollection = client.db("Doctors-Portal").collection("booking");
    const userCollection = client.db("Doctors-Portal").collection("user");

    console.log("db connect");

    app.get("/appointments", async (req, res) => {
      const query = {};
      const cursor = appointmentCollection.find(query);
      const result = await cursor.toArray();
      // console.log(result)
      res.send(result);
    });

    app.get("/booking", async (req, res) => {
      const patient = req.query.patient;
      // const decodedEmail = req.decoded.email;
      // if (patient === decodedEmail) {
      const query = { patient: patient };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
      /* } else {
        return res.status(403).send({ message: "Forbiden access" });
      } */
    });

    app.get("/available", async (req, res) => {
      const date = req.query.date;
      console.log(date);
      //step-1. to get all services
      const services = await appointmentCollection.find().toArray();
      // step-2 to get all booked of that day.
      const query = { date: date };
      const bookings = await bookingCollection.find(query).toArray();
      console.log(bookings);
      // step- 3 for service
      services.forEach((service) => {
        // step-4 find booking of that service
        const serviceBooking = bookings.filter(
          (book) => book.treatmentName == service.name
        );
        //step-5 fined the booked slot
        const bookedSlots = serviceBooking.map((book) => book.slot);
        // step-6 to get available slots
        const availableSlots = service.slots.filter(
          (s) => !bookedSlots.includes(s)
        );
        service.slots = availableSlots; // service er slolt guloke availableSlot die replace kora
      });
      res.send(services);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      // console.log("server part:", email);
      const user = req.body;
      filter = { email: email };
      options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });

    // For new booking purpose
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const query = {
        treatmentName: booking.treatmentName,
        patient: booking.patient,

        date: booking.date,
      };
      // console.log(query);
      const exist = await bookingCollection.findOne(query);
      if (exist) {
        return res.send({ success: false, booking: exist });
      }
      const result = await bookingCollection.insertOne(booking);
      return res.send({ success: true, result });
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
