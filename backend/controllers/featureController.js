const { sql, pool } = require("../config/db.js");

// -------- SHARED UTILITIES --------

exports.getStations = async (req, res) => {
    try {
        const conn = await pool;
        const result = await conn.request().query("SELECT station_id, station_name, location FROM Station ORDER BY station_id");
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
        await conn.request()
            .input('employee_id', sql.Int, parseInt(employee_id))
            .input('station_id',  sql.Int, station_id ? parseInt(station_id) : null)
            .input('shift',       sql.VarChar, shift)
            .query(`UPDATE Employee SET station_id = @station_id, shift = @shift WHERE employee_id = @employee_id`);
        res.json({ message: 'Employee assignment updated successfully.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getTrainStatus = async (req, res) => {
    try {
        const conn = await pool;
        const result = await conn.request().query("SELECT * FROM vw_LatestTrainStatus");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRevenueAnalytics = async (req, res) => {
    try {
        const conn = await pool;
        const result = await conn.request().query("SELECT * FROM vw_RevenueAnalytics ORDER BY revenue_date DESC");
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
        const result = await conn.request()
            .input("id", sql.Int, id)
            .query("SELECT name, account_balance, dbo.fn_GetPassengerTier(passenger_id) AS loyalty_tier FROM Passenger WHERE passenger_id = @id");
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
        const result = await conn.request()
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
        await conn.request()
            .input("movement_id", sql.Int, movement_id)
            .input("exit_station_id", sql.Int, exit_station_id)
            .execute("sp_CheckoutPassenger");
        res.json({ message: "Checkout successful. Fare deducted." });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getPassengerHistory = async (req, res) => {
    const { passenger_id } = req.params;
    try {
        const conn = await pool;
        const result = await conn.request()
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
        const result = await conn.request()
            .input("passenger_id", sql.Int, passenger_id)
            .query("SELECT * FROM Fine WHERE passenger_id = @passenger_id AND status = 'Unpaid' ORDER BY date DESC");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getActiveJourney = async (req, res) => {
    const { passenger_id } = req.params;
    try {
        const conn = await pool;
        const result = await conn.request()
            .input('passenger_id', sql.Int, passenger_id)
            .execute("sp_GetActiveJourney");
        res.json(result.recordset[0] || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.payFine = async (req, res) => {
    const { fine_id } = req.body;
    try {
        const conn = await pool;
        await conn.request()
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
        await conn.request()
            .input("passenger_id", sql.Int, passenger_id)
            .input("amount", sql.Float, amount)
            .input("payment_method", sql.VarChar, payment_method)
            .execute("sp_RechargeWallet");
        res.json({ message: `Successfully recharged ${amount} tk via ${payment_method}.` });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.estimateRoute = async (req, res) => {
    const { from_id, to_id } = req.params;
    try {
        const conn = await pool;
        const result = await conn.request()
            .input('from', sql.Int, parseInt(from_id))
            .input('to',   sql.Int, parseInt(to_id))
            .query('SELECT * FROM dbo.fn_RouteEstimator(@from, @to)');
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPassengerTier = async (req, res) => {
    const { passenger_id } = req.params;
    try {
        const conn = await pool;
        const result = await conn.request()
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
        const result = await conn.request()
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
        await conn.request()
            .input("train_id", sql.Int, train_id)
            .input("status", sql.VarChar, status)
            .execute("sp_DeployTrain");
        res.json({ message: `Train ${train_id} status updated to: ${status}` });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const conn = await pool;
        const result = await conn.request().query("SELECT TOP 50 * FROM Audit_Log ORDER BY timestamp DESC");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Added TOP 5 + ORDER BY since view no longer contains them
exports.getBusiestStations = async (req, res) => {
    try {
        const conn = await pool;
        const result = await conn.request().query(
            "SELECT TOP 5 * FROM vw_BusiestStations ORDER BY total_passenger_traffic DESC"
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
        const result = await conn.request()
            .input("year", sql.Int, parseInt(year))
            .input("month", sql.Int, parseInt(month))
            .execute("sp_MonthlyPassengerReport");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
