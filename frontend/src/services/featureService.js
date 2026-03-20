import axios from "axios";

const API_URL = "http://localhost:5000/api/features";

// Utility
export const getStations = async () => axios.get(`${API_URL}/stations`);

// Shared
export const getTrainStatus = async () => axios.get(`${API_URL}/train-status`);
export const getRevenueAnalytics = async () => axios.get(`${API_URL}/revenue`);
export const getEmployeeRoster = async () => axios.get(`${API_URL}/roster`);
export const updateEmployee = async (employee_id, data) =>
    axios.put(`${API_URL}/employee/${employee_id}`, data);
export const getUserBalance = async (id) => axios.get(`${API_URL}/balance/${id}`);

// Passenger
export const getPassengerHistory = async (id) => axios.get(`${API_URL}/history/${id}`);
export const getActiveJourney = async (id) => axios.get(`${API_URL}/active-journey/${id}`);
export const checkInPassenger = async (passenger_id, entry_station_id) =>
    axios.post(`${API_URL}/checkin`, { passenger_id, entry_station_id });
export const checkoutPassenger = async (movement_id, exit_station_id) =>
    axios.post(`${API_URL}/checkout`, { movement_id, exit_station_id });
export const rechargeWallet = async (passenger_id, amount, payment_method) =>
    axios.post(`${API_URL}/recharge`, { passenger_id, amount, payment_method });
export const getUnpaidFines = async (passenger_id) => axios.get(`${API_URL}/fines/${passenger_id}`);
export const payFine = async (fine_id) => axios.post(`${API_URL}/pay-fine`, { fine_id });
export const estimateRoute = async (from_id, to_id) => axios.get(`${API_URL}/route-estimate/${from_id}/${to_id}`);
export const getPassengerTier = async (passenger_id) => axios.get(`${API_URL}/loyalty/${passenger_id}`);

// Admin
export const getNextTrainArrival = async (station_id) => axios.get(`${API_URL}/next-train/${station_id}`);
export const deployTrain = async (train_id, status) => axios.post(`${API_URL}/deploy-train`, { train_id, status });
export const getAuditLogs = async () => axios.get(`${API_URL}/audit-logs`);
export const getBusiestStations = async () => axios.get(`${API_URL}/busiest-stations`);
export const getMonthlyReport = async (year, month) => axios.get(`${API_URL}/monthly-report/${year}/${month}`);
