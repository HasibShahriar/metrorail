// server.js
const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const config = {
  user: "metro",
  password: "a",
  server: "localhost",
  database: "metro_db",
  options: {
    trustServerCertificate: true
  }
};

sql.connect(config).then(() => console.log("DB Connected"));

app.get("/dashboard", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const passengers = await pool.request().query(`
      SELECT s.station_name, COUNT(pm.passenger_id) AS passenger_count
      FROM Passenger_movement pm
      JOIN Station s ON pm.station_id = s.station_id
      GROUP BY s.station_name
    `);

    const revenue = await pool.request().query(`
      SELECT SUM(fare) AS total_revenue FROM Passenger_movement
    `);

    const fines = await pool.request().query(`
      SELECT SUM(amount) AS total_fines FROM Fine
    `);

    const trains = await pool.request().query(`
      SELECT t.train_name, ts.status, ts.update_time
      FROM Train_status ts
      JOIN Train t ON ts.train_id = t.train_id
    `);

    res.json({
      passengers: passengers.recordset,
      revenue: revenue.recordset[0],
      fines: fines.recordset[0],
      trains: trains.recordset
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));