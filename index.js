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

    app.get("/available", async (req, res) => {
      const date = req.query.date;
      //step-1. to get all services
      const services = await appointmentCollection.find().toArray();
      // step-2 to get all booked of that day.
      const query = { date: date };
      const bookings = await bookingCollection.find(query).toArray();
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
    // For new booking purpose
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const query = {
        treatmentName: booking.treatmentName,
        patient: booking.patient,
        date: booking.date,
      };
      /* console.log(query) */
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
