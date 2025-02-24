import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [aggregatedData, setAggregatedData] = useState({});

  const [eventChartData, setEventChartData] = useState([]);
  const [videoChartData, setVideoChartData] = useState([]);

  const WS_URL = import.meta.env.VITE_WEBSOCKET_URL

  useEffect(() => {

    const connectWebSocket = () => {
      const socket = new WebSocket(WS_URL);
  
      socket.onopen = () => console.log("WebSocket Connected!");
  
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received:", data);

        if (data.type === "aggregate_data") {
          console.log("Updating Aggregated Data:", data.data);
          setAggregatedData(data.data); // Update aggregatedData state
      
          // Convert aggregated data to chart format and update state
          setEventChartData(
            Object.entries(data.data.eventCounts || {}).map(([event, count]) => ({
              event,
              count,
            }))
          );
      
          setVideoChartData(
            Object.entries(data.data.videoCounts || {}).map(([video, count]) => ({
              video,
              count,
            }))
          );
        }
      };
  
      socket.onerror = (error) => console.error("WebSocket Error:", error);
  
      socket.onclose = () => {
        console.warn("WebSocket Disconnected! Retrying in 3s...");
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center">Real-Time Log Traffic Dashboard</h1>

      <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Event Type Distribution (Last 30s)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={eventChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="event" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Most Watched Videos (Last 30s)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={videoChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="video" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="p-4 bg-white rounded-lg shadow-md text-lg text-center">
        <h2 className="text-lg font-semibold">Active Users (Last 30s): {aggregatedData.unique_users || 0}</h2>
      </div>
    </div>
  );
};

export default Dashboard;
