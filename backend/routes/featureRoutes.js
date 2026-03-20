const express = require("express");
const router = express.Router();
const fc = require("../controllers/featureController");

// Utility
router.get("/stations", fc.getStations);

// Admin / Shared
router.get("/roster", fc.getEmployeeRoster);
router.put("/employee/:employee_id", fc.updateEmployeeAssignment);
router.get("/train-status", fc.getTrainStatus);
router.get("/revenue", fc.getRevenueAnalytics);
router.post("/deploy-train", fc.deployTrain);
router.get("/next-train/:station_id", fc.getNextTrainArrival);
router.get("/audit-logs", fc.getAuditLogs);
router.get("/busiest-stations", fc.getBusiestStations);

// Passenger
router.get("/history/:passenger_id", fc.getPassengerHistory);
router.get("/active-journey/:passenger_id", fc.getActiveJourney);
router.get("/balance/:id", fc.getUserBalance);
router.post("/checkin", fc.checkInPassenger);
router.post("/checkout", fc.checkoutPassenger);
router.post("/recharge", fc.rechargeWallet);
router.get("/fines/:passenger_id", fc.getUnpaidFines);
router.post("/pay-fine", fc.payFine);
router.get("/route-estimate/:from_id/:to_id", fc.estimateRoute);
router.get("/loyalty/:passenger_id", fc.getPassengerTier);

// Admin maintenance
router.get("/monthly-report/:year/:month", fc.getMonthlyReport);

module.exports = router;
