import { useEffect, useState } from "react";
import * as Feat from "../services/featureService";

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState([]);
  const [trains, setTrains] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState("");
  const [loading, setLoading] = useState({});
  const [message, setMessage] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedRes, trainRes] = await Promise.all([
        Feat.getSchedules(),
        Feat.getTrainStatus(),
      ]);
      setSchedules(schedRes.data || []);
      setTrains(trainRes.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Error loading data" });
    }
  };

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

  const formatTimeForInput = (t) => {
    if (!t) return "00:00";
    if (typeof t === "string" && t.includes("T")) {
      const date = new Date(t);
      if (!isNaN(date.getTime())) return date.toTimeString().slice(0, 5);
    }
    return typeof t === "string" ? t.slice(0, 5) : "00:00";
  };

  const handleUpdateSchedule = async (scheduleId) => {
    if (!editingSchedule) return;
    setLoading((prev) => ({ ...prev, [scheduleId]: true }));
    try {
      await Feat.updateSchedule(
        scheduleId,
        editingSchedule.arrival_time,
        editingSchedule.departure_time,
      );
      setMessage({ type: "success", text: "Schedule updated successfully" });
      setEditingSchedule(null);
      await fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Error updating schedule",
      });
    }
    setLoading((prev) => ({ ...prev, [scheduleId]: false }));
  };

  const handleDeleteSchedule = async (scheduleId) => {
    setLoading((prev) => ({ ...prev, [scheduleId]: true }));
    try {
      await Feat.deleteSchedule(scheduleId);
      setMessage({ type: "success", text: "Schedule entry deleted" });
      await fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Error deleting schedule",
      });
    }
    setLoading((prev) => ({ ...prev, [scheduleId]: false }));
  };

  const filteredSchedules = selectedTrain
    ? schedules.filter((s) => s.train_id === parseInt(selectedTrain))
    : schedules;

  const trainGroups = {};
  filteredSchedules.forEach((s) => {
    if (!trainGroups[s.train_id]) trainGroups[s.train_id] = [];
    trainGroups[s.train_id].push(s);
  });

  const trainList = [
    ...new Map(
      schedules.map((s) => [
        s.train_id,
        { train_id: s.train_id, train_name: s.train_name },
      ]),
    ).values(),
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Schedule Manager</h2>

      {message && (
        <div
          className={`p-4 rounded-lg ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {message.text}
        </div>
      )}

      {/* Train Selection */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedTrain("")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${!selectedTrain ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          All Trains
        </button>
        {trainList.map((t) => (
          <button
            key={t.train_id}
            onClick={() => setSelectedTrain(t.train_id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${selectedTrain == t.train_id ? (t.train_name?.includes("Green") ? "bg-green-600 text-white" : "bg-red-600 text-white") : "bg-gray-100 text-gray-600"}`}
          >
            {t.train_name}
          </button>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {Object.values(trainGroups).map((trainSchedules, idx) => (
          <div
            key={trainSchedules[0].train_id}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-4 py-3 ${trainSchedules[0].train_name?.includes("Green") ? "bg-green-600" : "bg-red-600"}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                  {trainSchedules[0].train_name?.charAt(0)}
                </div>
                <div>
                  <div className="text-white font-bold">
                    {trainSchedules[0].train_name}
                  </div>
                  <div className="text-white/70 text-xs">
                    {trainSchedules.length} stations
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {trainSchedules
                .sort((a, b) => {
                  const isGreen =
                    trainSchedules[0].train_name?.includes("Green");
                  if (isGreen) {
                    return b.station_id - a.station_id;
                  }
                  return a.station_id - b.station_id;
                })
                .map((s, i) => (
                  <div
                    key={s.schedule_id}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-gray-800 text-sm block truncate">
                        {s.station_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {editingSchedule?.schedule_id === s.schedule_id ? (
                        <div className="flex items-center gap-1 bg-yellow-50 p-2 rounded-lg">
                          <input
                            type="time"
                            value={editingSchedule.arrival_time}
                            onChange={(e) =>
                              setEditingSchedule({
                                ...editingSchedule,
                                arrival_time: e.target.value,
                              })
                            }
                            className="w-28 bg-white border-2 border-yellow-300 rounded px-3 py-2 text-base font-mono font-bold"
                          />
                          <span className="text-gray-400 text-lg">→</span>
                          <input
                            type="time"
                            value={editingSchedule.departure_time}
                            onChange={(e) =>
                              setEditingSchedule({
                                ...editingSchedule,
                                departure_time: e.target.value,
                              })
                            }
                            className="w-28 bg-white border-2 border-yellow-300 rounded px-3 py-2 text-base font-mono font-bold"
                          />
                          <button
                            onClick={() => handleUpdateSchedule(s.schedule_id)}
                            disabled={loading[s.schedule_id]}
                            className="ml-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-sm"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingSchedule(null)}
                            className="px-2 py-2 text-gray-400 hover:text-gray-600 font-bold text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-indigo-600 font-mono text-base w-20 text-right font-semibold">
                            {formatTime(s.arrival_time)}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-red-600 font-mono text-base w-20 font-semibold">
                            {formatTime(s.departure_time)}
                          </span>
                          <button
                            onClick={() =>
                              setEditingSchedule({
                                schedule_id: s.schedule_id,
                                arrival_time: toInputTime(s.arrival_time),
                                departure_time: toInputTime(s.departure_time),
                              })
                            }
                            className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded text-xs"
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
