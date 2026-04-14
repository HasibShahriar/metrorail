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
router.get("/active-journeys", fc.getActiveJourneys);
router.get("/balance/:id", fc.getUserBalance);
router.post("/checkin", fc.checkInPassenger);
router.post("/checkout", fc.checkoutPassenger);
router.post("/recharge", fc.rechargeWallet);
router.get("/fines/all-admin", fc.getAllFinesAdmin);
router.post("/fine/issue", fc.issueFine);
router.post("/fine/waive", fc.waiveFine);
router.post("/fine/penalty", fc.applyPenalty);
router.get("/fines/all/:passenger_id", fc.getAllFines);
router.get("/fines/:passenger_id", fc.getUnpaidFines);
router.post("/pay-fine", fc.payFine);
router.get("/route-estimate/:from_id/:to_id", fc.estimateRoute);
router.get("/loyalty/:passenger_id", fc.getPassengerTier);

// Admin maintenance
router.get("/monthly-report/:year/:month", fc.getMonthlyReport);
router.get("/all-passengers-history", fc.getAllPassengersHistory);
router.get("/all-passengers", fc.getAllPassengers);

// Coach management
router.get("/coaches", fc.getAllCoaches);
router.get("/coaches/train/:train_id", fc.getCoachesByTrain);
router.get("/coaches/reserved", fc.getReservedCoaches);
router.post("/coach/mark-faulty", fc.markCoachFaulty);
router.post("/coach/swap", fc.swapCoach);
router.get("/coach/history/:coach_id", fc.getCoachHistory);

// Schedule Management
router.get("/schedules", fc.getSchedules);
router.post("/schedule", fc.addSchedule);
router.put("/schedule/:schedule_id", fc.updateSchedule);
router.delete("/schedule/:schedule_id", fc.deleteSchedule);

module.exports = router;
