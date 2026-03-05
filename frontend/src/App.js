// Dashboard.jsx
import { useEffect, useState } from "react";

function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/dashboard")
      .then(res => res.json())
      .then(data => setData(data));
  }, []);

  if (!data) return <h2>Loading...</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Metro Dashboard</h1>

      <h2>Total Revenue: {data.revenue.total_revenue}</h2>
      <h2>Total Fines: {data.fines.total_fines}</h2>

      <h3>Passenger Count Per Station</h3>
      <ul>
        {data.passengers.map((p, i) => (
          <li key={i}>
            {p.station_name}: {p.passenger_count}
          </li>
        ))}
      </ul>

      <h3>Train Status</h3>
      <ul>
        {data.trains.map((t, i) => (
          <li key={i}>
            {t.train_name} - {t.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;