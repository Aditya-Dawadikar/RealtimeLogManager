import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import QueryTab from '../tabs/QueryTab'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("Query")
  const [logs, setLogs] = useState([]);
  const [aggregatedData, setAggregatedData] = useState({});
  const [trafficData, setTrafficData] = useState([]);
  const [eventChartData, setEventChartData] = useState([]);
  const [videoChartData, setVideoChartData] = useState([]);

  const WS_URL = import.meta.env.VITE_WEBSOCKET_URL

  useEffect(() => {

    let logCount = 0;

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

        } else if (data.type === "raw_log") {
          console.log("Appending log:", data.data);
          logCount++

          setLogs((prevLogs) => {
            const newLogs = [...prevLogs, data.data];
            // return newLogs.slice(-50); // Keep only the last 50 logs for performance
            return newLogs
          });

        }
      };

      socket.onerror = (error) => console.error("WebSocket Error:", error);

      socket.onclose = () => {
        console.warn("WebSocket Disconnected! Retrying in 3s...");
        setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();

    const trafficInterval = setInterval(() => {
      const trafficPoint = {
        timestamp: new Date().toLocaleTimeString(),
        count: logCount,
      }

      setTrafficData((prevData) => [...prevData, trafficPoint])
      logCount = 0;
    }, 500)

    return () => clearInterval(trafficInterval)

  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center">Real-Time Log Traffic Dashboard</h1>
      
      <div className='m-5'>
        <button 
          className={`mx-2 px-4 py-2 rounded ${activeTab === "Charts" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={()=>{setActiveTab("Charts")}}>Real-Time Updates</button>
        <button
          className={`mx-2 px-4 py-2 rounded ${activeTab === "Query" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={()=>{setActiveTab("Query")}}>Query Logs</button>
      </div>

      {
        activeTab === 'Charts' ? (
          <div>

            <div className="grid grid-cols-3 gap-4">
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

              <div className="flex items-center justify-center bg-white rounded-lg shadow-md p-4 w-48 h-48 mx-auto">
                <h2 className="text-lg font-semibold text-center">
                  Active Users <br /> (Last 30s): {aggregatedData.unique_users || 0}
                </h2>
              </div>

              <div className="col-span-3 bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-2">Real-Time Traffic</h2>
                <ResponsiveContainer width="100%" height={300}>
                  {trafficData.length > 0 ? <LineChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#ff7300"
                      strokeWidth={3}
                      isAnimationActive={false}
                      dot={false}
                    />
                  </LineChart> : (
                    <p className="text-gray-500 text-center">Waiting for traffic data...</p>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <QueryTab logs={logs}/>
        )
      }
    </div >
  );
};

export default Dashboard;
