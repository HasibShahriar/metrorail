import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../services/authService";
import { logout, getUserInfo, setUserInfo } from "../utils/auth";
import * as Feat from "../services/featureService";
import { useSocket } from "../contexts/SocketContext";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import CoachManagement from "./CoachManagement";
import ScheduleManagement from "./ScheduleManagement";
import FineManagement from "./FineManagement";

const SHIFTS = ["Morning", "Afternoon", "Evening", "Night"];

export default function Dashboard() {
  const navigate = useNavigate();
  const socket = useSocket();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [activeJourney, setActiveJourney] = useState(null);

  // Global shared data
  const [stations, setStations] = useState([]); // FIX: fetched from API, not hardcoded
  const [balance, setBalance] = useState(0);
  const [loyaltyTier, setLoyaltyTier] = useState("Bronze");
  const [fines, setFines] = useState([]);

  // Tab data
  const [trains, setTrains] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [roster, setRoster] = useState([]);
  const [history, setHistory] = useState([]);
  const [fineHistory, setFineHistory] = useState([]);
  const [nextTrains, setNextTrains] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [busiestStations, setBusiestStations] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [allPassengersHistory, setAllPassengersHistory] = useState({
    travel: [],
    fines: [],
  });

  // Form state
  const [checkoutData, setCheckoutData] = useState({
    movement_id: "",
    exit_station_id: "",
  });
  const [deployData, setDeployData] = useState({
    train_id: 1,
    status: "Departing",
  });
  const [searchStationId, setSearchStationId] = useState("");
  const [rechargeAmt, setRechargeAmt] = useState("");
  const [routeFrom, setRouteFrom] = useState("");
  const [routeTo, setRouteTo] = useState("");
  const [checkinStation, setCheckinStation] = useState("");
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");

  // Analytics chart state
  const [revenueView, setRevenueView] = useState("chart");
  const [chartType, setChartType] = useState("bar");

  // Results
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [activeJourneys, setActiveJourneys] = useState([]);
  const [deployResult, setDeployResult] = useState(null);
  const [walletResult, setWalletResult] = useState(null);
  const [routeResult, setRouteResult] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [lowBalance, setLowBalance] = useState(false);
  // Roster editing state
  const [rosterEdits, setRosterEdits] = useState({}); // { employee_id: { station_id, shift } }
  const [rosterResult, setRosterResult] = useState(null);
  const [checkinResult, setCheckinResult] = useState(null);

  // Loading states — FIX: prevent double-submit
  const [loading, setLoading] = useState({});
  const setLoad = (key, val) => setLoading((p) => ({ ...p, [key]: val }));

  // FIX: Balance/fines loaded on mount and refreshed — shows in header on all tabs
  const fetchPassengerData = useCallback(async (passengerId) => {
    try {
      const [balRes, fineRes, journeyRes] = await Promise.all([
        Feat.getUserBalance(passengerId),
        Feat.getUnpaidFines(passengerId),
        Feat.getActiveJourney(passengerId),
      ]);
      const bal = balRes.data.account_balance || 0;
      setBalance(bal);
      setLowBalance(bal < 50);
      setLoyaltyTier(balRes.data.loyalty_tier || "Bronze");
      setFines(fineRes.data || []);
      setActiveJourney(journeyRes.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        // First, try to get cached user info from sessionStorage
        const cachedUser = getUserInfo();

        // Set from cache first for immediate UI render
        if (cachedUser) {
          setUser(cachedUser);
          const admin =
            cachedUser.role && cachedUser.role.toLowerCase() === "admin";
          setIsAdmin(admin);
          setActiveTab(admin ? "analytics" : "history");
          if (!admin) fetchPassengerData(cachedUser.passenger_id);
        }

        // Then fetch fresh data from API to verify/update
        const [profileRes, stationsRes] = await Promise.all([
          getProfile(),
          Feat.getStations(),
        ]);
        const u = profileRes.data.user;

        // Update sessionStorage with fresh data
        setUserInfo(u);

        setUser(u);
        setStations(stationsRes.data);
        const admin = u.role && u.role.toLowerCase() === "admin";
        setIsAdmin(admin);
        setActiveTab(admin ? "analytics" : "history");
        if (!admin) fetchPassengerData(u.passenger_id);
      } catch (err) {
        console.error("Init error:", err);
      }
    };
    fetchInit();
  }, [fetchPassengerData]);

  // Set default station selects once stations load
  useEffect(() => {
    if (stations.length > 0) {
      if (!searchStationId) setSearchStationId(stations[0].station_id);
      if (!checkinStation) setCheckinStation(stations[0].station_id);
      if (!checkoutData.exit_station_id)
        setCheckoutData((d) => ({
          ...d,
          exit_station_id: stations[0].station_id,
        }));
      if (!routeFrom) setRouteFrom(stations[0].station_id);
      if (!routeTo) setRouteTo(stations[stations.length - 1].station_id);
    }
  }, [
    stations,
    searchStationId,
    checkinStation,
    checkoutData.exit_station_id,
    routeFrom,
    routeTo,
  ]);

  const loadData = useCallback(
    async (tab) => {
      if (!user) return;
      try {
        if (tab === "trains") {
          const r = await Feat.getTrainStatus();
          setTrains(r.data);
        } else if (tab === "analytics") {
          const r = await Feat.getRevenueAnalytics();
          setAnalytics(r.data);
        } else if (tab === "roster") {
          const r = await Feat.getEmployeeRoster();
          setRoster(r.data);
        } else if (tab === "history") {
          const r = await Feat.getPassengerHistory(user.passenger_id);
          setHistory(r.data);
          const f = await Feat.getAllFines(user.passenger_id);
          setFineHistory(f.data);
          await fetchPassengerData(user.passenger_id);
        } else if (tab === "wallet") {
          await fetchPassengerData(user.passenger_id);
        } else if (tab === "audit") {
          const r = await Feat.getAuditLogs();
          setAuditLogs(r.data);
        } else if (tab === "stats") {
          const r = await Feat.getBusiestStations();
          setBusiestStations(r.data);
        } else if (tab === "userhistory") {
          const r = await Feat.getAllPassengersHistory();
          setAllPassengersHistory(r.data);
        } else if (tab === "deploy") {
          const r = await Feat.getTrainStatus();
          setTrains(r.data);
        } else if (tab === "checkout") {
          const r = await Feat.getActiveJourneys();
          setActiveJourneys(r.data);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [user, fetchPassengerData],
  );

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, user, loadData]);

  // Auto-refresh: poll every 5 seconds for user data (fines, balance, trains)
  useEffect(() => {
    if (!user || isAdmin) return;
    const interval = setInterval(() => {
      fetchPassengerData(user.passenger_id);
      if (activeTab === "trains") {
        Feat.getTrainStatus().then((r) => setTrains(r.data));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user, isAdmin, activeTab, fetchPassengerData]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !user) return;

    const handleFineIssued = () => {
      console.log("Fine issued event received");
      fetchPassengerData(user.passenger_id);
    };

    const handleTrainUpdated = () => {
      console.log("Train updated event received");
      Feat.getTrainStatus().then((r) => setTrains(r.data));
    };

    const handleBalanceUpdated = () => {
      console.log("Balance updated event received");
      fetchPassengerData(user.passenger_id);
    };

    socket.on("fineIssued", handleFineIssued);
    socket.on("trainUpdated", handleTrainUpdated);
    socket.on("balanceUpdated", handleBalanceUpdated);

    return () => {
      socket.off("fineIssued", handleFineIssued);
      socket.off("trainUpdated", handleTrainUpdated);
      socket.off("balanceUpdated", handleBalanceUpdated);
    };
  }, [socket, user, fetchPassengerData]);

  // ---- Handlers ----
  const handleCheckin = async (e) => {
    e.preventDefault();
    setLoad("checkin", true);
    setCheckinResult(null);
    try {
      const r = await Feat.checkInPassenger(
        user.passenger_id,
        parseInt(checkinStation),
      );
      setCheckinResult({ type: "success", msg: r.data.message });
      await fetchPassengerData(user.passenger_id);
    } catch (err) {
      setCheckinResult({
        type: "error",
        msg: err.response?.data?.error || "Check-in failed.",
      });
    } finally {
      setLoad("checkin", false);
    }
  };

  const handlePassengerCheckout = async (e) => {
    e.preventDefault();
    if (!activeJourney) return;
    setLoad("checkout", true);
    setCheckinResult(null);
    setReceipt(null);
    try {
      const r = await Feat.checkoutPassenger(
        activeJourney.passenger_movement_id,
        parseInt(checkoutData.exit_station_id),
      );
      setCheckinResult({ type: "success", msg: r.data.message });
      setReceipt(r.data.receipt);
      await fetchPassengerData(user.passenger_id);
    } catch (err) {
      setCheckinResult({
        type: "error",
        msg: err.response?.data?.error || "Checkout failed.",
      });
    } finally {
      setLoad("checkout", false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoad("checkout", true);
    try {
      const r = await Feat.checkoutPassenger(
        parseInt(checkoutData.movement_id),
        parseInt(checkoutData.exit_station_id),
      );
      setCheckoutResult({ type: "success", msg: r.data.message });
      fetchPassengerData(user.passenger_id);
    } catch (err) {
      setCheckoutResult({
        type: "error",
        msg: err.response?.data?.error || "Checkout failed.",
      });
    } finally {
      setLoad("checkout", false);
    }
  };

  const handleDeployTrain = async (e) => {
    e.preventDefault();
    setLoad("deploy", true);
    try {
      const r = await Feat.deployTrain(deployData.train_id, deployData.status);
      setDeployResult({ type: "success", msg: r.data.message });
    } catch (err) {
      setDeployResult({
        type: "error",
        msg: err.response?.data?.error || "Deploy failed.",
      });
    } finally {
      setLoad("deploy", false);
    }
  };

  const handleSearchNextTrain = async (e) => {
    e.preventDefault();
    setLoad("search", true);
    try {
      const r = await Feat.getNextTrainArrival(searchStationId);
      setNextTrains(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoad("search", false);
    }
  };

  const handleRecharge = async (e) => {
    e.preventDefault();
    setLoad("recharge", true);
    try {
      const r = await Feat.rechargeWallet(
        user.passenger_id,
        parseFloat(rechargeAmt),
        "Credit Card",
      );
      setWalletResult({ type: "success", msg: r.data.message });
      fetchPassengerData(user.passenger_id);
      setRechargeAmt("");
    } catch (err) {
      setWalletResult({
        type: "error",
        msg: err.response?.data?.error || "Recharge failed.",
      });
    } finally {
      setLoad("recharge", false);
    }
  };

  const handlePayFine = async (fineId) => {
    setLoad(`fine_${fineId}`, true);
    try {
      const r = await Feat.payFine(fineId);
      setWalletResult({ type: "success", msg: r.data.message });
      fetchPassengerData(user.passenger_id);
    } catch (err) {
      setWalletResult({
        type: "error",
        msg: err.response?.data?.error || "Payment failed.",
      });
    } finally {
      setLoad(`fine_${fineId}`, false);
    }
  };

  const handleRouteEstimate = async (e) => {
    e.preventDefault();
    setLoad("route", true);
    setRouteResult(null);
    try {
      const res = await Feat.estimateRoute(routeFrom, routeTo);
      setRouteResult(res.data);
    } catch (err) {
      setRouteResult(err.response?.data?.error || "No direct route found.");
    } finally {
      setLoad("route", false);
    }
  };

  const handleUpdateEmployee = async (employee) => {
    const edit = rosterEdits[employee.employee_id];
    if (!edit) return;
    setLoad("roster", true);
    setRosterResult(null);
    try {
      // Merge edit with existing data to prevent accidental nulls
      const finalStation =
        edit.station_id !== undefined
          ? edit.station_id
          : employee.current_station_id;
      const finalShift = edit.shift !== undefined ? edit.shift : employee.shift;
      await Feat.updateEmployee(employee.employee_id, {
        station_id: finalStation,
        shift: finalShift,
      });
      setRosterEdits((prev) => {
        const n = { ...prev };
        delete n[employee.employee_id];
        return n;
      });
      // SUCCESS: Refresh data but show status message correctly
      setRosterResult({
        type: "success",
        msg: "Employee updated successfully.",
      });
      await loadData("roster", Feat.getEmployeeRoster, setRoster);
    } catch (err) {
      setRosterResult({
        type: "error",
        msg: err.response?.data?.error || "Update failed.",
      });
    } finally {
      setLoad("roster", false);
    }
  };

  const handleMonthlyReport = async (e) => {
    e.preventDefault();
    setLoad("report", true);
    try {
      const r = await Feat.getMonthlyReport(reportYear, reportMonth);
      setMonthlyReport(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoad("report", false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-2xl font-bold">
        Loading Metro Systems...
      </div>
    );

  // ---- Station dropdown helper ----
  const StationSelect = ({ value, onChange, className }) => (
    <select value={value} onChange={onChange} className={className}>
      {stations.map((s) => (
        <option key={s.station_id} value={s.station_id}>
          {s.station_name}
        </option>
      ))}
    </select>
  );

  const resultBox = (r) =>
    r && (
      <div
        className={`mt-4 p-4 rounded-xl border text-sm font-semibold ${r.type === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"}`}
      >
        {r.msg}
      </div>
    );

  const formatTime = (t) => {
    if (!t) return "—";
    if (typeof t === "string") {
      if (t.includes("T")) {
        const date = new Date(t);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      }
      return t.slice(0, 5);
    }
    return "—";
  };

  const toInputTime = (t) => {
    if (!t) return "";
    if (typeof t === "string") {
      if (t.includes("T")) {
        const date = new Date(t);
        if (!isNaN(date.getTime())) {
          return date.toTimeString().slice(0, 5);
        }
      }
      return t.slice(0, 5);
    }
    return "";
  };

  const tierColors = {
    Gold: "text-yellow-600 bg-yellow-100",
    Silver: "text-slate-600 bg-slate-200",
    Bronze: "text-orange-700 bg-orange-100",
  };

  const adminTabs = [
    { id: "analytics", label: "Revenue Analytics" },
    { id: "stats", label: "Busiest Stations" },
    { id: "report", label: "Monthly Report" },
    { id: "audit", label: "Audit Trails" },
    { id: "deploy", label: "Deploy Train" },
    { id: "checkout", label: "Force Checkout" },
    { id: "roster", label: "Shift Roster" },
    { id: "schedule", label: "Schedule Manager" },
    { id: "coaches", label: "Coach Management" },
    { id: "fines", label: "Fine Management" },
    { id: "userhistory", label: "User Travel History" },
  ];

  const passengerTabs = [
    { id: "checkin", label: activeJourney ? "🚉 Check Out" : "🚉 Check In" },
    { id: "wallet", label: "Wallet & Fines" },
    { id: "history", label: "Travel History" },
    { id: "route", label: "Route Estimator" },
    { id: "search", label: "Search Station" },
    { id: "trains", label: "Live Train Board" },
  ];

  const tabList = isAdmin ? adminTabs : passengerTabs;
  const accent = isAdmin
    ? {
        from: "from-red-700",
        to: "to-red-500",
        ring: "focus:ring-red-500",
        active: "bg-red-50 border-red-500 text-red-700",
        btn: "bg-red-600 hover:bg-red-700",
      }
    : {
        from: "from-blue-600",
        to: "to-indigo-700",
        ring: "focus:ring-indigo-500",
        active: "bg-indigo-50 border-indigo-600 text-indigo-700",
        btn: "bg-indigo-600 hover:bg-indigo-700",
      };

  const inputCls = `w-full bg-gray-100 text-gray-800 p-3 rounded-lg border-none ${accent.ring} focus:ring-2`;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      {/* HEADER */}
      <header
        className={`shadow-md p-5 flex items-center justify-between bg-gradient-to-r ${accent.from} ${accent.to}`}
      >
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">
            {isAdmin ? "MetroRail Admin Console" : "MetroRail Commuter"}
          </h1>
          <p className="text-white/70 text-xs mt-0.5">
            {isAdmin ? "" : `Welcome back, ${user.name}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/profile")}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white font-semibold text-sm transition"
          >
            My Profile
          </button>
          {!isAdmin && (
            <>
              {lowBalance && (
                <button
                  onClick={() => setActiveTab("wallet")}
                  className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-bold text-xs px-3 py-2 rounded-full shadow animate-pulse transition"
                >
                  ⚠️ Low Balance — Tap to Recharge
                </button>
              )}
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${tierColors[loyaltyTier]}`}
              >
                {loyaltyTier === "Gold"
                  ? "🏆"
                  : loyaltyTier === "Silver"
                    ? "🥈"
                    : "🥉"}{" "}
                {loyaltyTier}
              </span>
              <span className="text-white font-semibold bg-black/20 px-4 py-2 rounded-full text-sm">
                💳 ৳{balance.toFixed(2)}
              </span>
            </>
          )}
          {isAdmin && (
            <span className="text-white font-semibold bg-black/20 px-4 py-2 rounded-full text-sm">
              System Admin
            </span>
          )}
          <button
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white font-semibold text-sm transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-64 bg-white shadow-xl flex flex-col p-4 space-y-1 border-r border-gray-200 overflow-y-auto flex-shrink-0">
          {tabList.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col text-left px-3 py-2.5 rounded-xl transition-all duration-200 ${activeTab === tab.id ? `${accent.active} border-l-4 shadow-sm` : "hover:bg-gray-100 text-gray-600"}`}
            >
              <span className="font-bold text-sm">{tab.label}</span>
              <span className="text-[11px] text-gray-400">{tab.desc}</span>
            </button>
          ))}
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
          {/* ===== PASSENGER: DYNAMIC CHECK IN / CHECK OUT ===== */}
          {activeTab === "checkin" && (
            <div
              className={
                receipt ? "flex gap-8 items-start" : "max-w-lg space-y-6"
              }
            >
              {/* CHECK IN/OUT FORM */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex-1 max-w-lg">
                {activeJourney ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">
                      Check Out
                    </h2>
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6 mt-4">
                      <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                        Active Journey
                      </div>
                      <div className="font-bold text-indigo-800 text-lg">
                        Entered at {activeJourney.entry_station_name}
                      </div>
                      <div className="text-xs text-indigo-400">
                        At{" "}
                        {new Date(
                          activeJourney.entry_time,
                        ).toLocaleTimeString()}
                      </div>
                    </div>
                    <form
                      onSubmit={handlePassengerCheckout}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Exit Station
                        </label>
                        <StationSelect
                          value={checkoutData.exit_station_id}
                          onChange={(e) =>
                            setCheckoutData({
                              ...checkoutData,
                              exit_station_id: e.target.value,
                            })
                          }
                          className={inputCls}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading.checkout}
                        className={`w-full ${accent.btn} text-white font-bold py-3 rounded-xl shadow transition disabled:opacity-50`}
                      >
                        {loading.checkout
                          ? "Checking Out..."
                          : "💳 Tap Card — Exit System"}
                      </button>
                      <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest mt-2">
                        Fare will be deducted automatically
                      </p>
                    </form>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">
                      Check In to Metro
                    </h2>
                    {balance < 100 && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm font-semibold">
                        ⚠️ Your balance is ৳{balance.toFixed(2)}. A minimum of
                        ৳100 is required to enter.
                        <button
                          onClick={() => setActiveTab("wallet")}
                          className="ml-2 underline font-bold hover:text-yellow-900"
                        >
                          Recharge Now
                        </button>
                      </div>
                    )}
                    <form onSubmit={handleCheckin} className="space-y-4 mt-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Entry Station
                        </label>
                        <StationSelect
                          value={checkinStation}
                          onChange={(e) => setCheckinStation(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading.checkin || balance < 100}
                        className={`w-full ${accent.btn} text-white font-bold py-3 rounded-xl shadow transition disabled:opacity-50`}
                      >
                        {loading.checkin
                          ? "Checking In..."
                          : "🚉 Tap Card — Enter System"}
                      </button>
                    </form>
                  </>
                )}
                {resultBox(checkinResult)}
              </div>

              {/* TRIP RECEIPT CARD - ONLY SHOWS AFTER CHECKOUT */}
              {receipt && (
                <div className="w-96 h-fit sticky top-8">
                  <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
                    <div
                      className={`px-8 py-5 bg-gradient-to-r ${accent.from} ${accent.to}`}
                    >
                      <div className="text-white font-extrabold text-lg">
                        🧾 Trip Receipt
                      </div>
                      <div className="text-white/70 text-xs">
                        Journey complete
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      {/* Route */}
                      <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <div className="text-center">
                          <div className="text-xs font-bold text-indigo-400 uppercase">
                            From
                          </div>
                          <div className="font-black text-indigo-900 text-sm">
                            {receipt.entry_station_name}
                          </div>
                        </div>
                        <div className="text-indigo-300 font-bold text-lg">
                          ➡
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-indigo-400 uppercase">
                            To
                          </div>
                          <div className="font-black text-indigo-900 text-sm">
                            {receipt.exit_station_name}
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                          <div className="text-xs font-bold text-gray-400 uppercase">
                            Distance
                          </div>
                          <div className="font-black text-gray-800 text-base">
                            {(parseFloat(receipt.distance) || 0).toFixed(2)} km
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                          <div className="text-xs font-bold text-gray-400 uppercase">
                            Duration
                          </div>
                          <div className="font-black text-gray-800 text-base">
                            {(
                              parseFloat(receipt.duration_minutes) || 0
                            ).toFixed(2)}{" "}
                            min
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                          <div className="text-xs font-bold text-gray-400 uppercase">
                            Base
                          </div>
                          <div className="font-black text-gray-500 text-base">
                            ৳{(parseFloat(receipt.base_fare) || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                          <div className="text-xs font-bold text-green-500 uppercase">
                            Paid
                          </div>
                          <div className="font-black text-green-800 text-base">
                            ৳{(parseFloat(receipt.final_fare) || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Discount row — only if discount applied */}
                      {receipt.discount_pct > 0 && (
                        <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                          <span className="text-xs font-bold text-yellow-800">
                            {receipt.loyalty_tier === "Gold" ? "🏆" : "🥈"}{" "}
                            {receipt.discount_pct}%
                          </span>
                          <span className="text-xs font-black text-yellow-700">
                            Save ৳
                            {(
                              parseFloat(
                                receipt.base_fare - receipt.final_fare,
                              ) || 0
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* New Balance */}
                      <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                        <span className="text-xs font-bold text-indigo-700">
                          Balance
                        </span>
                        <span className="font-black text-indigo-900">
                          ৳{(parseFloat(receipt.new_balance) || 0).toFixed(2)}
                        </span>
                      </div>

                      {/* Tier badge */}
                      <div className="flex justify-center pt-2">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${tierColors[receipt.loyalty_tier]}`}
                        >
                          {receipt.loyalty_tier === "Gold"
                            ? "🏆"
                            : receipt.loyalty_tier === "Silver"
                              ? "🥈"
                              : "🥉"}{" "}
                          {receipt.loyalty_tier}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== PASSENGER: WALLET & FINES ===== */}
          {activeTab === "wallet" && (
            <div className="flex gap-8 flex-wrap">
              <div className="flex-1 min-w-[280px] bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Recharge Metro Pass
                </h2>
                <form onSubmit={handleRecharge} className="space-y-4">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Amount (e.g. 500)"
                    value={rechargeAmt}
                    onChange={(e) => setRechargeAmt(e.target.value)}
                    className="w-full bg-gray-100 p-4 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                  />
                  <button
                    type="submit"
                    disabled={loading.recharge}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow disabled:opacity-50"
                  >
                    {loading.recharge ? "Processing..." : "Recharge (+ ৳)"}
                  </button>
                </form>
                {resultBox(walletResult)}
              </div>
              <div className="w-[420px] min-w-[280px] bg-red-50 p-8 rounded-2xl shadow-lg border border-red-200">
                <h2 className="text-xl font-black text-red-800 mb-4">
                  🚨 Outstanding Fines
                </h2>
                {fines.length === 0 ? (
                  <div className="bg-white p-4 rounded-xl text-center text-green-600 font-bold shadow-sm">
                    ✅ No outstanding fines.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fines.map((f) => (
                      <div
                        key={f.fine_id}
                        className="bg-white p-4 rounded-xl border-l-4 border-red-500 shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-gray-800 text-sm">
                            {f.reason}
                          </span>
                          <span className="font-black text-red-600">
                            ৳{f.amount.toFixed(0)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                          Applied {f.penalty_count}/3 late fee penalties
                        </div>
                        <button
                          onClick={() => handlePayFine(f.fine_id)}
                          disabled={loading[`fine_${f.fine_id}`]}
                          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg uppercase disabled:opacity-50"
                        >
                          {loading[`fine_${f.fine_id}`]
                            ? "Paying..."
                            : "Pay Now"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== PASSENGER: HISTORY ===== */}
          {activeTab === "history" && (
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  My Travel History
                </h2>
                <table className="min-w-full text-left bg-white border border-gray-200 rounded-lg overflow-hidden text-sm">
                  <thead className="bg-indigo-50 text-indigo-800 font-semibold border-b border-indigo-100">
                    <tr>
                      <th className="p-4">Entry Station</th>
                      <th className="p-4">Exit Station</th>
                      <th className="p-4">Date/Time</th>
                      <th className="p-4">Fare Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((h, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-semibold">
                          {h.entry_station_name}
                        </td>
                        <td className="p-4 text-gray-500">
                          {h.exit_station_name || (
                            <span className="text-blue-500 animate-pulse">
                              In Transit...
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-xs">
                          {new Date(h.entry_time).toLocaleString()}
                        </td>
                        <td className="p-4 text-green-600 font-bold">
                          {h.fare ? `৳${h.fare}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  My Fine History
                </h2>
                <table className="min-w-full text-left bg-white border border-gray-200 rounded-lg overflow-hidden text-sm">
                  <thead className="bg-red-50 text-red-800 font-semibold border-b border-red-100">
                    <tr>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fineHistory.map((f, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-semibold">{f.reason}</td>
                        <td className="p-4 font-mono text-xs">
                          {new Date(f.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-red-600 font-bold">
                          ৳{f.amount.toFixed(0)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${f.status === "Paid" ? "bg-green-100 text-green-700" : f.status === "Waived" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}
                          >
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {fineHistory.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          className="p-4 text-center text-gray-400"
                        >
                          No fine history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== PASSENGER: ROUTE ESTIMATOR ===== */}
          {activeTab === "route" && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-4xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                Trip Estimator & Network Path
              </h2>
              <form onSubmit={handleRouteEstimate} className="flex gap-4 mb-6">
                <StationSelect
                  value={routeFrom}
                  onChange={(e) => setRouteFrom(e.target.value)}
                  className={`flex-1 ${inputCls}`}
                />
                <div className="flex items-center font-bold text-indigo-300">
                  ➡
                </div>
                <StationSelect
                  value={routeTo}
                  onChange={(e) => setRouteTo(e.target.value)}
                  className={`flex-1 ${inputCls}`}
                />
                <button
                  type="submit"
                  disabled={loading.route}
                  className={`${accent.btn} text-white font-bold py-3 px-6 rounded-xl shadow disabled:opacity-50`}
                >
                  {loading.route ? "Tracing..." : "Trace Path"}
                </button>
              </form>
              {routeResult && typeof routeResult === "string" && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl font-bold">
                  {routeResult}
                </div>
              )}
              {routeResult && typeof routeResult === "object" && (
                <div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 text-center">
                      <div className="text-xs font-bold text-indigo-400 uppercase">
                        Distance
                      </div>
                      <div className="text-2xl font-black text-indigo-900">
                        {(parseFloat(routeResult.Distance) || 0).toFixed(2)} km
                      </div>
                    </div>
                    <div className="bg-green-50 p-5 rounded-xl border border-green-100 text-center">
                      <div className="text-xs font-bold text-green-500 uppercase">
                        Fare
                      </div>
                      <div className="text-2xl font-black text-green-800">
                        ৳
                        {(parseFloat(routeResult.EstimatedFare) || 0).toFixed(
                          2,
                        )}
                      </div>
                    </div>
                    <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 text-center">
                      <div className="text-xs font-bold text-orange-400 uppercase">
                        Duration
                      </div>
                      <div className="text-2xl font-black text-orange-800">
                        {(
                          (parseFloat(routeResult.EstimatedMinutes) || 0) +
                          2 * Math.abs(parseInt(routeTo) - parseInt(routeFrom))
                        ).toFixed(2)}{" "}
                        min
                      </div>
                    </div>
                  </div>

                  {/* Route Visual - Metro Map Style */}
                  {routeResult.Path && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-xs font-bold text-gray-400 uppercase mb-3">
                        Route Map
                      </div>
                      <div className="relative w-full overflow-x-auto">
                        <svg
                          viewBox="0 0 800 160"
                          className="w-full h-full min-w-[700px]"
                        >
                          {/* Main line */}
                          <line
                            x1="40"
                            y1="60"
                            x2="760"
                            y2="60"
                            stroke="#d1d5db"
                            strokeWidth="3"
                          />
                          {/* Colored path overlay */}
                          {(() => {
                            const fromId = parseInt(routeFrom);
                            const toId = parseInt(routeTo);
                            const startX =
                              40 + (Math.min(fromId, toId) - 1) * 45;
                            const endX = 40 + (Math.max(fromId, toId) - 1) * 45;
                            return (
                              <line
                                x1={startX}
                                y1="60"
                                x2={endX}
                                y2="60"
                                stroke="#6366f1"
                                strokeWidth="5"
                              />
                            );
                          })()}
                          {/* Station nodes - always show all 17 */}
                          {[
                            { id: 1, name: "Uttara North" },
                            { id: 2, name: "Uttara Center" },
                            { id: 3, name: "Uttara South" },
                            { id: 4, name: "Pallabi" },
                            { id: 5, name: "Mirpur 11" },
                            { id: 6, name: "Mirpur 10" },
                            { id: 7, name: "Kazipara" },
                            { id: 8, name: "Shewrapara" },
                            { id: 9, name: "Agargaon" },
                            { id: 10, name: "Bijoy Sarani" },
                            { id: 11, name: "Farmgate" },
                            { id: 12, name: "Karwan Bazar" },
                            { id: 13, name: "Shahbag" },
                            { id: 14, name: "Dhaka Univ" },
                            { id: 15, name: "Bangla Sec" },
                            { id: 16, name: "Motijheel" },
                            { id: 17, name: "Kamlapur" },
                          ].map((station, idx) => {
                            const xPos = 40 + idx * 45;
                            const fromId = parseInt(routeFrom);
                            const toId = parseInt(routeTo);
                            const isStart = station.id === fromId;
                            const isEnd = station.id === toId;
                            const isOnPath =
                              station.id >= Math.min(fromId, toId) &&
                              station.id <= Math.max(fromId, toId);

                            // Station name always vertical - 90 degrees clockwise
                            const textY = 100;

                            let nodeFill = "#ffffff";
                            let nodeStroke = "#d1d5db";
                            let nodeText = "#6b7280";
                            if (isStart) {
                              nodeFill = "#22c55e";
                              nodeStroke = "#16a34a";
                              nodeText = "#ffffff";
                            } else if (isEnd) {
                              nodeFill = "#ef4444";
                              nodeStroke = "#dc2626";
                              nodeText = "#ffffff";
                            } else if (isOnPath) {
                              nodeFill = "#6366f1";
                              nodeStroke = "#4f46e5";
                              nodeText = "#ffffff";
                            }

                            return (
                              <g key={station.id}>
                                <circle
                                  cx={xPos}
                                  cy="60"
                                  r="10"
                                  fill={nodeFill}
                                  stroke={nodeStroke}
                                  strokeWidth="2"
                                />
                                <text
                                  x={xPos}
                                  y="60"
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fill={nodeText}
                                  fontSize="7"
                                  fontWeight="bold"
                                >
                                  {station.id}
                                </text>
                                <text
                                  x={xPos}
                                  y={textY}
                                  textAnchor="middle"
                                  fill="#374151"
                                  fontSize="10"
                                  fontWeight="bold"
                                  transform={`rotate(-90, ${xPos}, ${textY})`}
                                >
                                  {station.name}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                      <div className="flex gap-4 mt-4 text-xs justify-center">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-green-500 border border-green-600" />
                          <span className="text-gray-600">Start</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-indigo-500 border border-indigo-600" />
                          <span className="text-gray-600">Path</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-red-500 border border-red-600" />
                          <span className="text-gray-600">End</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-white border border-gray-300" />
                          <span className="text-gray-600">Other</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TRANSFER FARE TAB REMOVED */}

          {/* ===== PASSENGER: SEARCH STATION ===== */}
          {activeTab === "search" && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-3xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Search Upcoming Trains
              </h2>
              <form
                onSubmit={handleSearchNextTrain}
                className="flex gap-4 mb-6"
              >
                <StationSelect
                  value={searchStationId}
                  onChange={(e) => setSearchStationId(e.target.value)}
                  className={`flex-1 ${inputCls}`}
                />
                <button
                  type="submit"
                  disabled={loading.search}
                  className={`${accent.btn} text-white font-bold py-3 px-6 rounded-xl shadow disabled:opacity-50`}
                >
                  {loading.search ? "Searching..." : "Search"}
                </button>
              </form>
              {nextTrains.length > 0 && (
                <div className="space-y-3">
                  {nextTrains.map((t, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-4 rounded-xl border bg-gray-50"
                    >
                      <div>
                        <div className="font-bold text-gray-800">
                          {t.train_name}
                        </div>
                        <div className="text-xs text-indigo-500 font-semibold">
                          {t.route_name} Route
                        </div>
                      </div>
                      <div className="text-indigo-700 font-black text-xl font-mono">
                        {t.arrival_time
                          ? (() => {
                              try {
                                // If it's already a full date string
                                const d = new Date(t.arrival_time);
                                if (!isNaN(d.getTime()))
                                  return d.toLocaleTimeString([], {
                                    timeStyle: "short",
                                  });

                                // If it's a T-SQL TIME string (HH:mm:ss.xxxx)
                                const parts = t.arrival_time.split(":");
                                if (parts.length >= 2) {
                                  return `${parts[0]}:${parts[1]}`;
                                }
                                return t.arrival_time;
                              } catch (e) {
                                return t.arrival_time;
                              }
                            })()
                          : "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== PASSENGER: LIVE TRAINS ===== */}
          {activeTab === "trains" && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-4xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Live Metro Board
              </h2>
              <div className="space-y-4">
                {trains.map((t, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-5 rounded-2xl bg-slate-800 text-white shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-500/30 rounded-full flex items-center justify-center text-2xl animate-pulse shadow-inner">
                        🚇
                      </div>
                      <div>
                        <div className="font-bold text-lg">{t.train_name}</div>
                        <div className="text-xs text-indigo-300 font-mono">
                          {t.route_name.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`px-4 py-1.5 text-xs rounded-full font-bold uppercase ${t.status === "Running" ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]"}`}
                      >
                        {t.status}
                      </span>
                      <div className="font-mono text-[10px] text-gray-400 mt-1">
                        Updated: {new Date(t.update_time).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== ADMIN: ANALYTICS ===== */}
          {activeTab === "analytics" &&
            (() => {
              const chartData = [...analytics].reverse().map((a) => ({
                date: new Date(a.revenue_date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                }),
                Fare: parseFloat(a.total_fare_revenue) || 0,
                Fines: parseFloat(a.total_fine_revenue) || 0,
                Total:
                  (parseFloat(a.total_fare_revenue) || 0) +
                  (parseFloat(a.total_fine_revenue) || 0),
                Trips: a.total_trips,
              }));

              const totalFare = analytics.reduce(
                (s, a) => s + (parseFloat(a.total_fare_revenue) || 0),
                0,
              );
              const totalFines = analytics.reduce(
                (s, a) => s + (parseFloat(a.total_fine_revenue) || 0),
                0,
              );
              const totalTrips = analytics.reduce(
                (s, a) => s + (a.total_trips || 0),
                0,
              );

              const ChartComponent = chartType === "bar" ? BarChart : LineChart;
              const FareElement =
                chartType === "bar" ? (
                  <Bar dataKey="Fare" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                ) : (
                  <Line
                    dataKey="Fare"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={false}
                  />
                );
              const FinesElement =
                chartType === "bar" ? (
                  <Bar dataKey="Fines" fill="#ef4444" radius={[4, 4, 0, 0]} />
                ) : (
                  <Line
                    dataKey="Fines"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                );

              return (
                <div className="space-y-6 max-w-6xl">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
                      <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                        Total Fare Revenue
                      </div>
                      <div className="text-3xl font-black text-indigo-900 mt-1">
                        ৳{totalFare.toFixed(0)}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
                      <div className="text-xs font-bold text-red-400 uppercase tracking-widest">
                        Total Fine Revenue
                      </div>
                      <div className="text-3xl font-black text-red-700 mt-1">
                        ৳{totalFines.toFixed(0)}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Total Trips
                      </div>
                      <div className="text-3xl font-black text-gray-800 mt-1">
                        {totalTrips}
                      </div>
                    </div>
                  </div>

                  {/* Chart Card */}
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">
                        Daily Revenue Analytics
                      </h2>
                      <div className="flex gap-2">
                        {["chart", "table"].map((v) => (
                          <button
                            key={v}
                            onClick={() => setRevenueView(v)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition capitalize ${revenueView === v ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                          >
                            {v === "chart" ? "📊 Chart" : "📋 Table"}
                          </button>
                        ))}
                        {revenueView === "chart" &&
                          ["bar", "line"].map((v) => (
                            <button
                              key={v}
                              onClick={() => setChartType(v)}
                              className={`px-4 py-1.5 rounded-full text-xs font-bold transition capitalize ${chartType === v ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                            >
                              {v === "bar" ? "Bar" : "Line"}
                            </button>
                          ))}
                      </div>
                    </div>

                    {revenueView === "chart" ? (
                      <ResponsiveContainer width="100%" height={360}>
                        <ChartComponent
                          data={chartData}
                          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                            tickFormatter={(v) => `৳${v}`}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                            }}
                            formatter={(value, name) => [`৳${value}`, name]}
                          />
                          <Legend />
                          {FareElement}
                          {FinesElement}
                        </ChartComponent>
                      </ResponsiveContainer>
                    ) : (
                      <table className="min-w-full text-left border border-gray-200 rounded-lg overflow-hidden text-sm">
                        <thead className="bg-red-50 text-red-800 font-semibold border-b">
                          <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Trips</th>
                            <th className="p-4 text-indigo-600">
                              Fare Revenue
                            </th>
                            <th className="p-4 text-red-500">Fine Revenue</th>
                            <th className="p-4 text-gray-600">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {analytics.map((a, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="p-4 font-mono">
                                {new Date(a.revenue_date).toLocaleDateString()}
                              </td>
                              <td className="p-4 font-bold">{a.total_trips}</td>
                              <td className="p-4 text-indigo-600 font-bold">
                                ৳{a.total_fare_revenue}
                              </td>
                              <td className="p-4 text-red-500 font-bold">
                                ৳{a.total_fine_revenue}
                              </td>
                              <td className="p-4 text-gray-700 font-black">
                                ৳
                                {(
                                  parseFloat(a.total_fare_revenue) +
                                  parseFloat(a.total_fine_revenue)
                                ).toFixed(0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              );
            })()}

          {/* ===== ADMIN: BUSIEST STATIONS ===== */}
          {activeTab === "stats" && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Station Traffic Analysis
              </h2>
              <div className="space-y-3">
                {busiestStations.map((s, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 border rounded-xl bg-gray-50 shadow-sm"
                  >
                    <div className="flex gap-4 items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${i === 0 ? "bg-red-500" : i === 1 ? "bg-orange-400" : "bg-gray-400"}`}
                      >
                        #{i + 1}
                      </div>
                      <span className="font-bold text-lg">
                        {s.station_name}
                      </span>
                    </div>
                    <span className="font-bold font-mono text-red-700 bg-red-100 px-3 py-1 rounded-full">
                      {s.total_passenger_traffic} Trips
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== ADMIN: MONTHLY REPORT ===== */}
          {activeTab === "report" && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-5xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                Monthly Passenger Report
              </h2>
              <form onSubmit={handleMonthlyReport} className="flex gap-4 mb-6">
                <input
                  type="number"
                  value={reportYear}
                  onChange={(e) => setReportYear(e.target.value)}
                  min="2020"
                  max="2099"
                  className="w-32 bg-gray-100 p-3 rounded-lg border-none focus:ring-2 focus:ring-red-500 font-bold"
                  placeholder="Year"
                />
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  className="w-40 bg-gray-100 p-3 rounded-lg border-none focus:ring-2 focus:ring-red-500"
                >
                  {[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ].map((m, i) => (
                    <option key={i} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={loading.report}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow disabled:opacity-50"
                >
                  {loading.report ? "Loading..." : "Generate Report"}
                </button>
              </form>
              {monthlyReport.length > 0 && (
                <table className="min-w-full text-left border border-gray-200 rounded-lg overflow-hidden text-sm">
                  <thead className="bg-red-50 text-red-800 font-semibold border-b">
                    <tr>
                      <th className="p-4">Passenger</th>
                      <th className="p-4">Trips</th>
                      <th className="p-4">Total Spent</th>
                      <th className="p-4">Avg Fare</th>
                      <th className="p-4">Fines</th>
                      <th className="p-4">Loyalty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {monthlyReport.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-4 font-bold">{r.passenger_name}</td>
                        <td className="p-4">{r.total_trips}</td>
                        <td className="p-4 text-green-600 font-bold">
                          ৳{r.total_spent.toFixed(0)}
                        </td>
                        <td className="p-4">
                          ৳{r.avg_fare_per_trip.toFixed(0)}
                        </td>
                        <td className="p-4 text-red-500">{r.fines_incurred}</td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${tierColors[r.loyalty_tier]}`}
                          >
                            {r.loyalty_tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ===== ADMIN: AUDIT LOGS ===== */}
          {activeTab === "audit" && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-5xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Security Audit Trails
              </h2>
              <table className="min-w-full text-left border border-gray-200 rounded-lg overflow-hidden text-sm">
                <thead className="bg-red-50 text-red-800 font-semibold border-b">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Table / Action</th>
                    <th className="p-3 text-red-500">Old State</th>
                    <th className="p-3 text-green-600">New State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs">
                        {new Date(a.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-sm">
                        {a.table_name}
                        <br />
                        <span className="text-xs text-gray-400 font-normal">
                          {a.action_type}
                        </span>
                      </td>
                      <td className="p-3 bg-red-50/40 text-red-800 font-mono text-[10px] break-all max-w-[150px]">
                        {a.old_value}
                      </td>
                      <td className="p-3 bg-green-50/40 text-green-800 font-mono text-[10px] break-all max-w-[150px]">
                        {a.new_value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MAINTENANCE TAB REMOVED */}

          {/* ===== ADMIN: DEPLOY TRAIN ===== */}
          {activeTab === "deploy" && (
            <div className="max-w-xl bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Deploy Train Status Update
              </h2>
              <form onSubmit={handleDeployTrain} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Train
                  </label>
                  <select
                    value={deployData.train_id}
                    onChange={(e) =>
                      setDeployData({ ...deployData, train_id: e.target.value })
                    }
                    className={inputCls}
                  >
                    {trains.map((t) => (
                      <option key={t.train_id} value={t.train_id}>
                        {t.train_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Status Command
                  </label>
                  <select
                    value={deployData.status}
                    onChange={(e) =>
                      setDeployData({ ...deployData, status: e.target.value })
                    }
                    className={inputCls}
                  >
                    <option value="Departing">Departing</option>
                    <option value="Running">Running on Track</option>
                    <option value="At Station">At Station</option>
                    <option value="Delayed">Delayed / Halted</option>
                    <option value="Emergency Stop">Emergency Stop</option>
                    <option value="Standby">Standby</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading.deploy}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow disabled:opacity-50"
                >
                  {loading.deploy ? "Injecting..." : "Execute Status Injection"}
                </button>
              </form>
              {resultBox(deployResult)}
            </div>
          )}

          {/* ===== ADMIN: FORCE CHECKOUT ===== */}
          {activeTab === "checkout" && (
            <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                Simulate Force Checkout
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Select Passenger
                </label>
                <select
                  value={checkoutData.movement_id}
                  onChange={(e) =>
                    setCheckoutData({
                      ...checkoutData,
                      movement_id: e.target.value,
                    })
                  }
                  className={inputCls}
                >
                  <option value="">— Select Passenger —</option>
                  {activeJourneys.map((j) => (
                    <option
                      key={j.passenger_movement_id}
                      value={j.passenger_movement_id}
                    >
                      {j.passenger_name} (ID: {j.passenger_id}) - From{" "}
                      {j.entry_station_name}
                    </option>
                  ))}
                </select>
              </div>
              {checkoutData.movement_id && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-blue-800 text-sm">
                  Passenger is in transit from station:{" "}
                  <strong>
                    {
                      activeJourneys.find(
                        (j) =>
                          j.passenger_movement_id ===
                          parseInt(checkoutData.movement_id),
                      )?.entry_station_name
                    }
                  </strong>
                </div>
              )}
              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Exit Station
                  </label>
                  <StationSelect
                    value={checkoutData.exit_station_id}
                    onChange={(e) =>
                      setCheckoutData({
                        ...checkoutData,
                        exit_station_id: e.target.value,
                      })
                    }
                    className={inputCls}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading.checkout || !checkoutData.movement_id}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl shadow disabled:opacity-50"
                >
                  {loading.checkout
                    ? "Processing..."
                    : "Commit Checkout Procedure"}
                </button>
              </form>
              {resultBox(checkoutResult)}
            </div>
          )}

          {/* ===== ADMIN: ROSTER (with inline editing) ===== */}
          {activeTab === "roster" && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                Organizational Roster
              </h2>
              {resultBox(rosterResult)}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
                {roster.map((emp) => {
                  const edit = rosterEdits[emp.employee_id] || {};
                  const isDirty = Object.keys(edit).length > 0;
                  return (
                    <div
                      key={emp.employee_id}
                      className={`bg-gray-50 rounded-2xl p-5 border-2 shadow-sm flex flex-col gap-3 transition-all ${isDirty ? "border-red-400 shadow-red-100" : "border-transparent"}`}
                    >
                      {/* Avatar + Name */}
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex items-center justify-center text-white text-lg font-black shadow flex-shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">
                            {emp.name}
                          </div>
                          <div className="text-xs text-red-600 font-semibold">
                            {emp.role}
                          </div>
                        </div>
                      </div>

                      {/* Station Selector */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          📍 Station Assignment
                        </label>
                        <select
                          value={
                            edit.station_id !== undefined
                              ? edit.station_id
                              : emp.current_station_id || ""
                          }
                          onChange={(e) =>
                            setRosterEdits((prev) => ({
                              ...prev,
                              [emp.employee_id]: {
                                ...prev[emp.employee_id],
                                station_id: e.target.value || null,
                              },
                            }))
                          }
                          className="mt-1 w-full bg-white border border-gray-200 text-gray-700 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:outline-none"
                        >
                          <option value="">— Unassigned —</option>
                          {stations.map((s) => (
                            <option key={s.station_id} value={s.station_id}>
                              {s.station_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Shift Selector */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          🕐 Shift
                        </label>
                        <div className="mt-1 flex gap-1 flex-wrap">
                          {SHIFTS.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() =>
                                setRosterEdits((prev) => ({
                                  ...prev,
                                  [emp.employee_id]: {
                                    ...prev[emp.employee_id],
                                    shift: s,
                                  },
                                }))
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                (edit.shift !== undefined
                                  ? edit.shift
                                  : emp.shift) === s
                                  ? "bg-red-600 text-white shadow"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4">
                        <button
                          disabled={!isDirty || loading.roster}
                          onClick={() => handleUpdateEmployee(emp)}
                          className={`px-6 py-2 rounded-xl font-bold text-sm shadow-md transition-all ${isDirty ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                        >
                          {loading.roster ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== ADMIN: SCHEDULE MANAGER ===== */}
          {activeTab === "schedule" && <ScheduleManagement />}

          {/* ===== ADMIN: COACH MANAGEMENT ===== */}
          {activeTab === "coaches" && <CoachManagement />}

          {/* ===== ADMIN: FINE MANAGEMENT ===== */}
          {activeTab === "fines" && <FineManagement />}

          {/* ===== ADMIN: USER TRAVEL HISTORY ===== */}
          {activeTab === "userhistory" &&
            (() => {
              // Group travel and fines by passenger_id
              const passengerMap = {};
              allPassengersHistory.travel.forEach((t) => {
                if (!passengerMap[t.passenger_id])
                  passengerMap[t.passenger_id] = {
                    passenger_id: t.passenger_id,
                    passenger_name: t.passenger_name,
                    travel: [],
                    fines: [],
                  };
                passengerMap[t.passenger_id].travel.push(t);
              });
              allPassengersHistory.fines.forEach((f) => {
                if (!passengerMap[f.passenger_id])
                  passengerMap[f.passenger_id] = {
                    passenger_id: f.passenger_id,
                    passenger_name: f.passenger_name,
                    travel: [],
                    fines: [],
                  };
                passengerMap[f.passenger_id].fines.push(f);
              });
              const passengers = Object.values(passengerMap);

              return (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-800">
                    User Travel & Fine History
                  </h2>
                  {passengers.map((p) => (
                    <div
                      key={p.passenger_id}
                      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                    >
                      {/* Passenger Partition Header */}
                      <div className="flex items-center gap-4 px-8 py-5 bg-gradient-to-r from-red-700 to-red-500">
                        <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center text-white text-lg font-black shadow flex-shrink-0">
                          {p.passenger_name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-extrabold text-lg">
                            {p.passenger_name}
                          </div>
                          <div className="text-white/70 text-xs font-mono">
                            Passenger ID #{p.passenger_id}
                          </div>
                        </div>
                        <div className="ml-auto flex gap-3">
                          <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                            🚉 {p.travel.length} Trips
                          </span>
                          <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                            🚨 {p.fines.length} Fines
                          </span>
                        </div>
                      </div>

                      <div className="p-8 space-y-6">
                        {/* Travel History Table */}
                        <div>
                          <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-widest mb-3">
                            Travel History
                          </h3>
                          <table className="min-w-full text-left bg-white border border-gray-200 rounded-lg overflow-hidden text-sm">
                            <thead className="bg-indigo-50 text-indigo-800 font-semibold border-b border-indigo-100">
                              <tr>
                                <th className="p-4">Entry Station</th>
                                <th className="p-4">Exit Station</th>
                                <th className="p-4">Date/Time</th>
                                <th className="p-4">Fare Paid</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {p.travel.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan="4"
                                    className="p-4 text-center text-gray-400"
                                  >
                                    No travel history found.
                                  </td>
                                </tr>
                              ) : (
                                p.travel.map((t, i) => (
                                  <tr
                                    key={i}
                                    className="hover:bg-gray-50 transition"
                                  >
                                    <td className="p-4 font-semibold">
                                      {t.entry_station_name}
                                    </td>
                                    <td className="p-4 text-gray-500">
                                      {t.exit_station_name || (
                                        <span className="text-blue-500 animate-pulse">
                                          In Transit...
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-4 font-mono text-xs">
                                      {new Date(t.entry_time).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-green-600 font-bold">
                                      {t.fare ? `৳${t.fare}` : "-"}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Fine History Table */}
                        <div>
                          <h3 className="text-sm font-bold text-red-700 uppercase tracking-widest mb-3">
                            Fine History
                          </h3>
                          <table className="min-w-full text-left bg-white border border-gray-200 rounded-lg overflow-hidden text-sm">
                            <thead className="bg-red-50 text-red-800 font-semibold border-b border-red-100">
                              <tr>
                                <th className="p-4">Reason</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {p.fines.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan="4"
                                    className="p-4 text-center text-gray-400"
                                  >
                                    No fine history found.
                                  </td>
                                </tr>
                              ) : (
                                p.fines.map((f, i) => (
                                  <tr
                                    key={i}
                                    className="hover:bg-gray-50 transition"
                                  >
                                    <td className="p-4 font-semibold">
                                      {f.reason}
                                    </td>
                                    <td className="p-4 font-mono text-xs">
                                      {new Date(f.date).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-red-600 font-bold">
                                      ৳{f.amount.toFixed(0)}
                                    </td>
                                    <td className="p-4">
                                      <span
                                        className={`text-xs font-bold px-2 py-1 rounded-full ${f.status === "Paid" ? "bg-green-100 text-green-700" : f.status === "Waived" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}
                                      >
                                        {f.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                  {passengers.length === 0 && (
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center text-gray-400">
                      No passenger history found.
                    </div>
                  )}
                </div>
              );
            })()}
        </main>
      </div>
    </div>
  );
}
