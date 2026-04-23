const { sql, pool } = require("../config/db.js");

// -------- SHARED UTILITIES --------

exports.getStations = async (req, res) => {
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .query(
        "SELECT station_id, station_name, location FROM Station ORDER BY station_id",
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------- SHARED / ADMIN FEATURES --------

exports.getEmployeeRoster = async (req, res) => {
  try {
    const conn = await pool;
    const result = await conn.request().query(`
            SELECT e.employee_id, e.name, e.role, e.shift, e.station_id AS current_station_id,
                   ISNULL(s.station_name, 'N/A') AS station_name,
                   ISNULL(t.train_name, 'N/A') AS train_name
            FROM Employee e
            LEFT JOIN Station s ON e.station_id = s.station_id
            LEFT JOIN Train t   ON e.train_id   = t.train_id
            ORDER BY e.shift, e.role;
        `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEmployeeAssignment = async (req, res) => {
  const { employee_id } = req.params;
  const { station_id, shift } = req.body;
  try {
    const conn = await pool;
    await conn
      .request()
      .input("employee_id", sql.Int, parseInt(employee_id))
      .input("station_id", sql.Int, station_id ? parseInt(station_id) : null)
      .input("shift", sql.VarChar, shift)
      .query(
        `UPDATE Employee SET station_id = @station_id, shift = @shift WHERE employee_id = @employee_id`,
      );
    res.json({ message: "Employee assignment updated successfully." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getTrainStatus = async (req, res) => {
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .query("SELECT * FROM vw_LatestTrainStatus");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRevenueAnalytics = async (req, res) => {
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .query("SELECT * FROM vw_RevenueAnalytics ORDER BY revenue_date DESC");
    res.json(result.recordset);
  } catch (err) {
    console.error("Revenue Analytics Error:", err);
    res.status(500).json({ error: "Failed to fetch revenue data." });
  }
};

exports.getUserBalance = async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input("id", sql.Int, id)
      .query(
        "SELECT name, account_balance, dbo.fn_GetPassengerTier(passenger_id) AS loyalty_tier FROM Passenger WHERE passenger_id = @id",
      );
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------- PASSENGER FEATURES --------

exports.checkInPassenger = async (req, res) => {
  const { passenger_id, entry_station_id } = req.body;
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input("passenger_id", sql.Int, passenger_id)
      .input("entry_station_id", sql.Int, entry_station_id)
      .execute("sp_CheckinPassenger");
    const movement_id = result.recordset[0]?.new_movement_id;
    res.json({ message: "Check-in successful! Safe travels.", movement_id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.checkoutPassenger = async (req, res) => {
  const { movement_id, exit_station_id } = req.body;
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input("movement_id", sql.Int, movement_id)
      .input("exit_station_id", sql.Int, exit_station_id)
      .execute("sp_CheckoutPassenger");

    const io = req.app.get("io");
    if (io) io.emit("balanceUpdated", { movement_id });

    res.json({
      message: "Checkout successful. Fare deducted.",
      receipt: result.recordset[0],
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPassengerHistory = async (req, res) => {
  const { passenger_id } = req.params;
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input("passenger_id", sql.Int, passenger_id)
      .execute("sp_GetPassengerHistory");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUnpaidFines = async (req, res) => {
  const { passenger_id } = req.params;
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input("passenger_id", sql.Int, passenger_id)
      .query(
        "SELECT * FROM Fine WHERE passenger_id = @passenger_id AND status = 'Unpaid' ORDER BY date DESC",
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFines = async (req, res) => {
  const { passenger_id } = req.params;
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input("passenger_id", sql.Int, passenger_id)
      .query(
        "SELECT * FROM Fine WHERE passenger_id = @passenger_id ORDER BY date DESC",
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActiveJourney = async (req, res) => {
  const { passenger_id } = req.params;
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input("passenger_id", sql.Int, passenger_id)
      .execute("sp_GetActiveJourney");
    res.json(result.recordset[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActiveJourneys = async (req, res) => {
  try {
    const conn = await pool;
    const result = await conn.request().query(`
            SELECT pm.passenger_movement_id, pm.passenger_id, p.name as passenger_name, 
                   pm.entry_station_id, es.station_name as entry_station_name, pm.entry_time
            FROM Passenger_movement pm
            INNER JOIN Passenger p ON pm.passenger_id = p.passenger_id
            INNER JOIN Station es ON pm.entry_station_id = es.station_id
            WHERE pm.exit_time IS NULL
            ORDER BY pm.entry_time DESC
        `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.payFine = async (req, res) => {
  const { fine_id } = req.body;
  try {
    const conn = await pool;
    await conn
      .request()
      .input("fine_id", sql.Int, fine_id)
      .execute("sp_PayFine");
    res.json({ message: `Fine #${fine_id} paid successfully.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.rechargeWallet = async (req, res) => {
  const { passenger_id, amount, payment_method } = req.body;
  try {
    const conn = await pool;
    await conn
      .request()
      .input("passenger_id", sql.Int, passenger_id)
      .input("amount", sql.Float, amount)
      .input("payment_method", sql.VarChar, payment_method)
      .execute("sp_RechargeWallet");

    const io = req.app.get("io");
    if (io) io.emit("balanceUpdated", { passenger_id });

    res.json({
      message: `Successfully recharged ${amount} tk via ${payment_method}.`,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.estimateRoute = async (req, res) => {
  const { from_id, to_id } = req.params;
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input("from", sql.Int, parseInt(from_id))
      .input("to", sql.Int, parseInt(to_id))
      .query("SELECT * FROM dbo.fn_RouteEstimator(@from, @to)");
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPassengerTier = async (req, res) => {
  const { passenger_id } = req.params;
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input("passenger_id", sql.Int, passenger_id)
      .query("SELECT dbo.fn_GetPassengerTier(@passenger_id) AS loyalty_tier");
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------- ADMIN FEATURES --------

exports.getNextTrainArrival = async (req, res) => {
  const { station_id } = req.params;
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input("station_id", sql.Int, station_id)
      .execute("sp_SearchNextTrainAtStation");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deployTrain = async (req, res) => {
  const { train_id, status } = req.body;
  try {
    const conn = await pool;
    await conn
      .request()
      .input("train_id", sql.Int, train_id)
      .input("status", sql.VarChar, status)
      .execute("sp_DeployTrain");

    const io = req.app.get("io");
    if (io) {
      io.emit("trainUpdated");
      console.log("Broadcasting trainUpdated");
    }

    res.json({ message: `Train ${train_id} status updated to: ${status}` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .query("SELECT TOP 50 * FROM Audit_Log ORDER BY timestamp DESC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Added TOP 5 + ORDER BY since view no longer contains them
exports.getBusiestStations = async (req, res) => {
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .query(
        "SELECT TOP 5 * FROM vw_BusiestStations ORDER BY total_passenger_traffic DESC",
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMonthlyReport = async (req, res) => {
  const { year, month } = req.params;
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input("year", sql.Int, parseInt(year))
      .input("month", sql.Int, parseInt(month))
      .execute("sp_MonthlyPassengerReport");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllPassengersHistory = async (req, res) => {
  try {
    const conn = await pool;
    const travelResult = await conn.request().query(`
            SELECT
                p.passenger_id, p.name AS passenger_name,
                pm.passenger_movement_id, pm.entry_time, pm.exit_time, pm.fare,
                es.station_name AS entry_station_name,
                xs.station_name AS exit_station_name
            FROM Passenger p
            INNER JOIN Passenger_movement pm ON p.passenger_id = pm.passenger_id
            LEFT JOIN Station es ON pm.entry_station_id = es.station_id
            LEFT JOIN Station xs ON pm.exit_station_id = xs.station_id
            WHERE p.role = 'Passenger'
            ORDER BY p.passenger_id, pm.entry_time DESC
        `);
    const fineResult = await conn.request().query(`
            SELECT
                p.passenger_id, p.name AS passenger_name,
                f.fine_id, f.reason, f.date, f.amount, f.status
            FROM Passenger p
            INNER JOIN Fine f ON p.passenger_id = f.passenger_id
            WHERE p.role = 'Passenger'
            ORDER BY p.passenger_id, f.date DESC
        `);
    res.json({ travel: travelResult.recordset, fines: fineResult.recordset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllPassengers = async (req, res) => {
  try {
    const conn = await pool;
    const result = await conn.request().query(`
            SELECT passenger_id, name
            FROM Passenger
            WHERE role = 'Passenger'
            ORDER BY name
        `);
    res.json(result.recordset);
  } catch (err) {
    console.error("getAllPassengers error:", err);
    res.status(500).json({ error: err.message });
  }
};

// -------- COACH MANAGEMENT --------

exports.getAllCoaches = async (req, res) => {
  try {
    const conn = await pool;
    const result = await conn.request().query(`
            SELECT c.coach_id, c.coach_number, c.capacity, c.status, c.is_reserved, c.train_id, t.train_name
            FROM Coach c
            LEFT JOIN Train t ON c.train_id = t.train_id
            ORDER BY c.train_id, c.coach_number
        `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCoachesByTrain = async (req, res) => {
  const { train_id } = req.params;
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input("train_id", sql.Int, parseInt(train_id))
      .query(
        "SELECT coach_id, coach_number, capacity, status, is_reserved FROM Coach WHERE train_id = @train_id ORDER BY coach_number",
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReservedCoaches = async (req, res) => {
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .query(
        "SELECT coach_id, coach_number, capacity FROM Coach WHERE is_reserved = 1 AND status = 'Reserved'",
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markCoachFaulty = async (req, res) => {
  const { coach_id } = req.body;
  try {
    const conn = await pool;
    await conn
      .request()
      .input("coach_id", sql.Int, coach_id)
      .execute("sp_MarkCoachFaulty");
    res.json({ message: `Coach marked as faulty.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.swapCoach = async (req, res) => {
  const { faulty_coach_id, reserved_coach_id, new_train_id } = req.body;
  try {
    const conn = await pool;
    await conn
      .request()
      .input("faulty_coach_id", sql.Int, faulty_coach_id)
      .input("reserved_coach_id", sql.Int, reserved_coach_id)
      .input("new_train_id", sql.Int, new_train_id)
      .execute("sp_SwapCoach");
    res.json({ message: `Coach swapped successfully.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getCoachHistory = async (req, res) => {
  const { coach_id } = req.params;
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input("coach_id", sql.Int, parseInt(coach_id))
      .query(
        "SELECT history_id, action, old_status, new_status, notes, action_date FROM CoachHistory WHERE coach_id = @coach_id ORDER BY action_date DESC",
      );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFinesAdmin = async (req, res) => {
  try {
    const conn = await pool;
    const result = await conn.request().query(`
            SELECT f.fine_id, f.passenger_id, p.name AS passenger_name,
                   f.reason, f.date, f.amount, f.status, ISNULL(f.penalty_count, 0) AS penalty_count
            FROM Fine f
            INNER JOIN Passenger p ON f.passenger_id = p.passenger_id
            ORDER BY f.date DESC
        `);
    res.json(result.recordset);
  } catch (err) {
    console.error("getAllFinesAdmin error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.issueFine = async (req, res) => {
  const { passenger_id, reason, amount } = req.body;
  try {
    const conn = await pool;
    const result = await conn
      .request()
      .input("passenger_id", sql.Int, passenger_id)
      .input("reason", sql.VarChar, reason)
      .input("amount", sql.Float, amount)
      .execute("sp_IssueFine");

    const io = req.app.get("io");
    if (io) {
      io.emit("fineIssued", { passenger_id });
      console.log("Broadcasting fineIssued for passenger:", passenger_id);
    }

    res.json({
      message: `Fine issued successfully.`,
      fine_id: result.recordset[0]?.fine_id,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.waiveFine = async (req, res) => {
  const { fine_id } = req.body;
  try {
    const conn = await pool;
    await conn
      .request()
      .input("fine_id", sql.Int, fine_id)
      .execute("sp_WaiveFine");
    res.json({ message: `Fine #${fine_id} waived successfully.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.applyPenalty = async (req, res) => {
  const { fine_id } = req.body;
  try {
    const conn = await pool;
    
    const checkResult = await conn.request()
      .input("fine_id", sql.Int, fine_id)
      .query(`
        SELECT amount, penalty_count FROM Fine 
        WHERE fine_id = @fine_id AND status = 'Unpaid' AND ISNULL(penalty_count, 0) < 3
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(400).json({
        error: "Fine not found, already resolved, or max penalties reached.",
      });
    }

    const oldAmount = checkResult.recordset[0].amount;

    await conn.request()
      .input("fine_id", sql.Int, fine_id)
      .query(`
        UPDATE Fine
        SET amount = amount + 100,
            penalty_count = ISNULL(penalty_count, 0) + 1
        WHERE fine_id = @fine_id
      `);

    res.json({
      message: `Penalty applied. New amount: ৳${oldAmount + 100}`,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// -------- SCHEDULE MANAGEMENT --------

exports.getSchedules = async (req, res) => {
  try {
    const conn = await pool;
    const result = await conn.request().query(`
            SELECT s.schedule_id, s.train_id, t.train_name, s.station_id,
                   st.station_name, 
                   CONVERT(VARCHAR(8), s.arrival_time, 108) AS arrival_time,
                   CONVERT(VARCHAR(8), s.departure_time, 108) AS departure_time
            FROM Schedule s
            INNER JOIN Train t  ON s.train_id   = t.train_id
            INNER JOIN Station st ON s.station_id = st.station_id
            ORDER BY s.train_id, s.arrival_time
        `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addSchedule = async (req, res) => {
  const { train_id, station_id, arrival_time, departure_time } = req.body;
  try {
    const conn = await pool;
    await conn
      .request()
      .input("train_id", sql.Int, parseInt(train_id))
      .input("station_id", sql.Int, parseInt(station_id))
      .input("arrival_time", sql.VarChar, arrival_time)
      .input("departure_time", sql.VarChar, departure_time)
      .query(`INSERT INTO Schedule (train_id, station_id, arrival_time, departure_time)
                    VALUES (@train_id, @station_id, @arrival_time, @departure_time)`);
    res.json({ message: "Schedule entry added successfully." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateSchedule = async (req, res) => {
  const { schedule_id } = req.params;
  const { arrival_time, departure_time } = req.body;
  try {
    const conn = await pool;
    await conn
      .request()
      .input("schedule_id", sql.Int, parseInt(schedule_id))
      .input("arrival_time", sql.VarChar, arrival_time)
      .input("departure_time", sql.VarChar, departure_time)
      .query(`UPDATE Schedule SET arrival_time = @arrival_time, departure_time = @departure_time
                    WHERE schedule_id = @schedule_id`);
    res.json({ message: "Schedule updated successfully." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  const { schedule_id } = req.params;
  try {
    const conn = await pool;
    await conn
      .request()
      .input("schedule_id", sql.Int, parseInt(schedule_id))
      .query(`DELETE FROM Schedule WHERE schedule_id = @schedule_id`);
    res.json({ message: "Schedule entry deleted." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
