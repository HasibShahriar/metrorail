import axios from "axios";

const API_URL = "http://localhost:5000/api/features";

// Add timestamp to prevent caching
const noCache = () => ({ _t: Date.now() });

// Utility
export const getStations = async () =>
  axios.get(`${API_URL}/stations`, { params: noCache() });

// Shared
export const getTrainStatus = async () => axios.get(`${API_URL}/train-status`);
export const getRevenueAnalytics = async () => axios.get(`${API_URL}/revenue`);
export const getEmployeeRoster = async () => axios.get(`${API_URL}/roster`);
export const updateEmployee = async (employee_id, data) =>
  axios.put(`${API_URL}/employee/${employee_id}`, data);
export const getUserBalance = async (id) =>
  axios.get(`${API_URL}/balance/${id}`);

// Passenger
export const getPassengerHistory = async (id) =>
  axios.get(`${API_URL}/history/${id}`);
export const getActiveJourney = async (id) =>
  axios.get(`${API_URL}/active-journey/${id}`);
export const getActiveJourneys = async () =>
  axios.get(`${API_URL}/active-journeys`);
export const checkInPassenger = async (passenger_id, entry_station_id) =>
  axios.post(`${API_URL}/checkin`, { passenger_id, entry_station_id });
export const checkoutPassenger = async (movement_id, exit_station_id) =>
  axios.post(`${API_URL}/checkout`, { movement_id, exit_station_id });
export const rechargeWallet = async (passenger_id, amount, payment_method) =>
  axios.post(`${API_URL}/recharge`, { passenger_id, amount, payment_method });
export const getUnpaidFines = async (passenger_id) =>
  axios.get(`${API_URL}/fines/${passenger_id}`);
export const getAllFines = async (passenger_id) =>
  axios.get(`${API_URL}/fines/all/${passenger_id}`);
export const payFine = async (fine_id) =>
  axios.post(`${API_URL}/pay-fine`, { fine_id });
export const estimateRoute = async (from_id, to_id) =>
  axios.get(`${API_URL}/route-estimate/${from_id}/${to_id}`);
export const getPassengerTier = async (passenger_id) =>
  axios.get(`${API_URL}/loyalty/${passenger_id}`);

// Admin
export const getNextTrainArrival = async (station_id) =>
  axios.get(`${API_URL}/next-train/${station_id}`);
export const deployTrain = async (train_id, status) =>
  axios.post(`${API_URL}/deploy-train`, { train_id, status });
export const getAuditLogs = async () => axios.get(`${API_URL}/audit-logs`);
export const getBusiestStations = async () =>
  axios.get(`${API_URL}/busiest-stations`);
export const getMonthlyReport = async (year, month) =>
  axios.get(`${API_URL}/monthly-report/${year}/${month}`);
export const getAllPassengersHistory = async () =>
  axios.get(`${API_URL}/all-passengers-history`);
export const getAllPassengers = async () =>
  axios.get(`${API_URL}/all-passengers`, { params: noCache() });

// Coach Management
export const getAllCoaches = async () => axios.get(`${API_URL}/coaches`);
export const getCoachesByTrain = async (train_id) =>
  axios.get(`${API_URL}/coaches/train/${train_id}`);
export const getReservedCoaches = async () =>
  axios.get(`${API_URL}/coaches/reserved`);
export const markCoachFaulty = async (coach_id) =>
  axios.post(`${API_URL}/coach/mark-faulty`, { coach_id });
export const swapCoach = async (
  faulty_coach_id,
  reserved_coach_id,
  new_train_id,
) =>
  axios.post(`${API_URL}/coach/swap`, {
    faulty_coach_id,
    reserved_coach_id,
    new_train_id,
  });
export const getCoachHistory = async (coach_id) =>
  axios.get(`${API_URL}/coach/history/${coach_id}`);

// Fine Management
export const getAllFinesAdmin = async () =>
  axios.get(`${API_URL}/fines/all-admin`, { params: noCache() });
export const issueFine = async (passenger_id, reason, amount) =>
  axios.post(`${API_URL}/fine/issue`, { passenger_id, reason, amount });
export const waiveFine = async (fine_id) =>
  axios.post(`${API_URL}/fine/waive`, { fine_id });
export const applyPenalty = async (fine_id) =>
  axios.post(`${API_URL}/fine/penalty`, { fine_id });

// Schedule Management
export const getSchedules = async () => axios.get(`${API_URL}/schedules`);
export const addSchedule = async (
  train_id,
  station_id,
  arrival_time,
  departure_time,
) =>
  axios.post(`${API_URL}/schedule`, {
    train_id,
    station_id,
    arrival_time,
    departure_time,
  });
export const updateSchedule = async (
  schedule_id,
  arrival_time,
  departure_time,
) =>
  axios.put(`${API_URL}/schedule/${schedule_id}`, {
    arrival_time,
    departure_time,
  });
export const deleteSchedule = async (schedule_id) =>
  axios.delete(`${API_URL}/schedule/${schedule_id}`);
