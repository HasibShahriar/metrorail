import { useEffect, useState } from "react";
import * as Feat from "../services/featureService";

export default function CoachManagement() {
  const [coaches, setCoaches] = useState([]);
  const [reservedCoaches, setReservedCoaches] = useState([]);
  const [trains, setTrains] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState("");
  const [faultyCoachId, setFaultyCoachId] = useState("");
  const [reservedCoachId, setReservedCoachId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coachRes, reservedRes] = await Promise.all([
        Feat.getAllCoaches(),
        Feat.getReservedCoaches(),
      ]);
      setCoaches(coachRes.data || []);
      setReservedCoaches(reservedRes.data || []);

      const uniqueTrains = [];
      const seenIds = new Set();
      (coachRes.data || []).forEach((c) => {
        if (c.train_id && !seenIds.has(c.train_id)) {
          seenIds.add(c.train_id);
          uniqueTrains.push({ id: c.train_id, name: c.train_name });
        }
      });
      setTrains(uniqueTrains);
      setSelectedTrain("");
    } catch (err) {
      console.error(err);
      setMessage("Error loading coaches");
    }
  };

  const handleMarkFaulty = async () => {
    if (!faultyCoachId) {
      setMessage("Select a coach");
      return;
    }
    setLoading(true);
    try {
      await Feat.markCoachFaulty(parseInt(faultyCoachId));
      setMessage("Coach marked faulty");
      setFaultyCoachId("");
      fetchData();
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage("Error marking coach");
    }
    setLoading(false);
  };

  const handleSwapCoach = async () => {
    if (!faultyCoachId || !reservedCoachId || !selectedTrain) {
      setMessage("Select all required fields");
      return;
    }
    setLoading(true);
    try {
      await Feat.swapCoach(
        parseInt(faultyCoachId),
        parseInt(reservedCoachId),
        parseInt(selectedTrain),
      );
      setMessage("Coach swapped");
      setFaultyCoachId("");
      setReservedCoachId("");
      fetchData();
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage("Error swapping coach");
    }
    setLoading(false);
  };

  const trainCoaches = selectedTrain
    ? coaches.filter((c) => c.train_id === parseInt(selectedTrain))
    : [];
  const enrichedReserved = reservedCoaches.map((c) => ({
    ...c,
    train_name: "N/A",
    status: "Reserved",
    is_reserved: true,
  }));
  const displayedCoaches = selectedTrain
    ? [...trainCoaches, ...enrichedReserved]
    : coaches;
  const faultyCoaches = trainCoaches.filter((c) => c.status === "Faulty");

  const handleTrainChange = (trainId) => {
    setSelectedTrain(trainId);
    setFaultyCoachId("");
    setReservedCoachId("");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Coach Management</h2>

      {message && (
        <div className="p-4 bg-blue-100 text-blue-700 rounded">{message}</div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-4">Mark Coach as Faulty</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm">Select Train</label>
              <select
                value={selectedTrain}
                onChange={(e) => handleTrainChange(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">-- Select --</option>
                {trains.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm">Select Coach</label>
              <select
                value={faultyCoachId}
                onChange={(e) => setFaultyCoachId(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">-- Select --</option>
                {trainCoaches
                  .filter((c) => c.status === "Active")
                  .map((c) => (
                    <option key={c.coach_id} value={c.coach_id}>
                      {c.coach_number} (Active)
                    </option>
                  ))}
              </select>
            </div>
            <button
              onClick={handleMarkFaulty}
              disabled={loading}
              className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 disabled:opacity-50"
            >
              Mark as Faulty
            </button>
          </div>
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-4">Swap Faulty Coach</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm">Faulty Coach</label>
              <select
                value={faultyCoachId}
                onChange={(e) => setFaultyCoachId(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">-- Select --</option>
                {faultyCoaches.map((c) => (
                  <option key={c.coach_id} value={c.coach_id}>
                    {c.coach_number} (Faulty)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm">Reserved Coach</label>
              <select
                value={reservedCoachId}
                onChange={(e) => setReservedCoachId(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">-- Select --</option>
                {reservedCoaches.map((c) => (
                  <option key={c.coach_id} value={c.coach_id}>
                    {c.coach_number}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSwapCoach}
              disabled={loading}
              className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              Swap Coach
            </button>
          </div>
        </div>
      </div>

      <div className="border p-4 rounded">
        <h3 className="font-semibold mb-4">All Coaches</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Coach #</th>
                <th className="p-2 text-left">Train</th>
                <th className="p-2 text-left">Capacity</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Reserved</th>
              </tr>
            </thead>
            <tbody>
              {displayedCoaches.map((c) => (
                <tr key={c.coach_id} className="border-t">
                  <td className="p-2">{c.coach_number}</td>
                  <td className="p-2">{c.train_name || "N/A"}</td>
                  <td className="p-2">{c.capacity}</td>
                  <td
                    className={`p-2 font-semibold ${c.status === "Faulty" ? "text-red-600" : c.status === "Active" ? "text-green-600" : "text-yellow-600"}`}
                  >
                    {c.status}
                  </td>
                  <td className="p-2">{c.is_reserved ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
