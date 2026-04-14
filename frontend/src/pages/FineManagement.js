import { useEffect, useState } from "react";
import * as Feat from "../services/featureService";

export default function FineManagement() {
  const [fines, setFines] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [issueData, setIssueData] = useState({
    passenger_id: "",
    reason: "",
    amount: "",
  });
  const [fineFilter, setFineFilter] = useState("All");
  const [loading, setLoading] = useState({});
  const [message, setMessage] = useState("");
  const [selectedFineType, setSelectedFineType] = useState("");

  const commonFines = [
    { reason: "Overstaying at the Station", amount: 100 },
    { reason: "Damaging Train Property", amount: 300 },
    { reason: "Fare Evasion", amount: 250 },
    { reason: "Not Following Safety Rules", amount: 100 },
    { reason: "Traveling Without Valid Ticket", amount: 150 },
    { reason: "Disrupting Other Passengers", amount: 180 },
    { reason: "Lost Ticket", amount: 200 },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const finesRes = await Feat.getAllFinesAdmin();
      setFines(finesRes.data || []);

      // Get all passengers for the dropdown
      const passengersRes = await Feat.getAllPassengers();
      const uniquePassengers = [];
      const seenIds = new Set();
      (passengersRes.data || []).forEach((p) => {
        if (p.passenger_id && !seenIds.has(p.passenger_id)) {
          seenIds.add(p.passenger_id);
          uniquePassengers.push({ id: p.passenger_id, name: p.name });
        }
      });
      setPassengers(uniquePassengers);
    } catch (err) {
      console.error("Error loading fines:", err);
      console.error("Response:", err.response?.data);
      setMessage(err.response?.data?.error || "Error loading fines");
    }
  };

  const handleIssueFine = async (e) => {
    e.preventDefault();
    if (!issueData.passenger_id || !issueData.reason || !issueData.amount) {
      setMessage("Fill all fields");
      return;
    }
    setLoading({ ...loading, issue: true });
    try {
      await Feat.issueFine(
        parseInt(issueData.passenger_id),
        issueData.reason,
        parseFloat(issueData.amount),
      );
      setMessage("Fine issued successfully");
      setIssueData({ passenger_id: "", reason: "", amount: "" });
      setSelectedFineType("");
      fetchData();
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage("Error issuing fine");
    }
    setLoading({ ...loading, issue: false });
  };

  const handleWaiveFine = async (fine_id) => {
    setLoading({ ...loading, [`waive_${fine_id}`]: true });
    try {
      await Feat.waiveFine(fine_id);
      setMessage("Fine waived");
      fetchData();
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage("Error waiving fine");
    }
    setLoading({ ...loading, [`waive_${fine_id}`]: false });
  };

  const handleApplyPenalty = async (fine_id) => {
    setLoading({ ...loading, [`penalty_${fine_id}`]: true });
    try {
      const res = await Feat.applyPenalty(fine_id);
      setMessage(res.data.message || "Penalty applied");
      fetchData();
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || "Error applying penalty");
    }
    setLoading({ ...loading, [`penalty_${fine_id}`]: false });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h3 className="font-semibold mb-4 text-lg">Issue Fine</h3>
        <form onSubmit={handleIssueFine} className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <select
              required
              value={issueData.passenger_id}
              onChange={(e) =>
                setIssueData({ ...issueData, passenger_id: e.target.value })
              }
              className="w-full border p-2 rounded bg-gray-50"
            >
              <option value="">-- Select Passenger --</option>
              {passengers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              required
              value={selectedFineType}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedFineType(val);
                if (val === "Other") {
                  setIssueData({ ...issueData, reason: "", amount: "" });
                } else {
                  const fine = commonFines[parseInt(val)];
                  setIssueData({
                    ...issueData,
                    reason: fine.reason,
                    amount: fine.amount.toString(),
                  });
                }
              }}
              className="w-full border p-2 rounded bg-gray-50"
            >
              <option value="">-- Select Fine Type --</option>
              {commonFines.map((fine, idx) => (
                <option key={idx} value={idx}>
                  {fine.reason} - ৳{fine.amount}
                </option>
              ))}
              <option value="Other">Other (Custom)</option>
            </select>
            {selectedFineType === "Other" ? (
              <input
                type="number"
                required
                min="1"
                placeholder="Amount"
                value={issueData.amount}
                onChange={(e) =>
                  setIssueData({ ...issueData, amount: e.target.value })
                }
                className="w-full border p-2 rounded bg-gray-50"
              />
            ) : (
              <div className="flex items-center justify-center bg-gray-100 rounded border">
                <span className="text-gray-600">Auto-filled</span>
              </div>
            )}
          </div>
          {selectedFineType === "Other" && (
            <input
              type="text"
              required
              placeholder="Reason"
              value={issueData.reason}
              onChange={(e) =>
                setIssueData({ ...issueData, reason: e.target.value })
              }
              className="w-full border p-2 rounded bg-gray-50"
            />
          )}
          <button
            type="submit"
            disabled={loading.issue}
            className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading.issue ? "Issuing..." : "🚨 Issue Fine"}
          </button>
        </form>
        {message && (
          <div className="mt-3 p-3 bg-blue-100 text-blue-700 rounded">
            {message}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">All Fines</h3>
          <div className="flex gap-2">
            {["All", "Unpaid", "Paid", "Waived"].map((f) => (
              <button
                key={f}
                onClick={() => setFineFilter(f)}
                className={`px-3 py-1 rounded text-xs font-bold ${fineFilter === f ? (f === "Waived" ? "bg-blue-600 text-white" : "bg-red-600 text-white") : "bg-gray-100 text-gray-600"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-red-50">
              <tr>
                <th className="p-3 text-left">Passenger</th>
                <th className="p-3 text-left">Reason</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Penalties</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fines
                .filter((f) => fineFilter === "All" || f.status === fineFilter)
                .map((f) => (
                  <tr key={f.fine_id} className="border-t">
                    <td className="p-3 font-semibold">{f.passenger_name}</td>
                    <td className="p-3 text-gray-600">{f.reason}</td>
                    <td className="p-3 text-xs">
                      {new Date(f.date).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-bold text-red-600">৳{f.amount}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${f.penalty_count >= 3 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {f.penalty_count}/3
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          f.status === "Paid"
                            ? "bg-green-100 text-green-700"
                            : f.status === "Waived"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {f.status === "Unpaid" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleWaiveFine(f.fine_id)}
                            disabled={loading[`waive_${f.fine_id}`]}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 disabled:opacity-50"
                          >
                            {loading[`waive_${f.fine_id}`] ? "..." : "Waive"}
                          </button>
                          <button
                            onClick={() => handleApplyPenalty(f.fine_id)}
                            disabled={
                              loading[`penalty_${f.fine_id}`] ||
                              f.penalty_count >= 3
                            }
                            className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200 disabled:opacity-50"
                          >
                            {loading[`penalty_${f.fine_id}`] ? "..." : "+৳100"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              {fines.filter(
                (f) => fineFilter === "All" || f.status === fineFilter,
              ).length === 0 && (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-400">
                    No fines
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
