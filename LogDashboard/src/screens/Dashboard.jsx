import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [trafficData, setTrafficData] = useState([]);

  useEffect(() => {
    const socket = new WebSocket("ws://192.168.1.137:9000"); // Connect to LogConsumer WebSocket

    socket.onmessage = (event) => {
      const logData = JSON.parse(event.data);
      if (logData.log) {
        setLogs((prevLogs) => [logData, ...prevLogs.slice(0, 50)]);

        setTrafficData((prevData) => {
          const newData = [...prevData, { time: new Date().toLocaleTimeString(), count: prevData.length + 1 }];
          return newData.slice(-20);
        });
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center">Real-Time Log Traffic Dashboard</h1>

      <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Traffic Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trafficData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Incoming Logs</h2>
        <div className="max-h-96 overflow-auto border rounded p-2 bg-gray-50">
          {logs.map((log, index) => (
            <div key={index} className="border-b p-2 text-sm font-mono bg-gray-200 rounded my-1">
              <pre className="text-gray-700">{JSON.stringify(log, null, 2)}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
