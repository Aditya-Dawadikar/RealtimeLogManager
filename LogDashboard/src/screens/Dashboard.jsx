import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

const Dashboard = () => {
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

          const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];

          setLogs((prevLogs) => {
            const newLogs = [...prevLogs, {
              timestamp,
              data: data.data,
              expanded: false,
            }];
            return newLogs.slice(-50); // Keep only the last 50 logs for performance
          });

          setTrafficData((prevData) => {
            const updatedData = [
              ...prevData,
              { timestamp: new Date().toLocaleTimeString(), count: prevData.length + 1 },
            ]
            return updatedData;
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

    const trafficInterval = setInterval(()=>{
      const trafficPoint = {
        timestamp: new Date().toLocaleTimeString(),
        count: logCount,
      }

      setTrafficData((prevData)=>[...prevData, trafficPoint])
      logCount = 0;
    },2000)

    return ()=>clearInterval(trafficInterval)

  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center">Real-Time Log Traffic Dashboard</h1>

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

        <div className="col-span-3 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-2">Live Log Stream (last 50 records)</h2>
          <div className="space-y-2 text-sm h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center">No logs available...</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="p-2 bg-gray-200 rounded cursor-pointer flex justify-between items-center"
                  onClick={() =>
                    setLogs((prevLogs) =>
                      prevLogs.map((l, i) =>
                        i === index ? { ...l, expanded: !l.expanded } : l
                      )
                    )
                  }
                >
                  <p className="text-gray-700 font-mono text-sm flex-1 text-left">
                    {log.timestamp}{" "}

                    <span className="text-blue-500 text-lg px-2">
                      {log.expanded ? "▼" : "▶"} {/* Expand/Collapse Icon */}
                    </span>
                  </p>
                  <div className='text-left flex-1'>
                    {log.expanded ? (
                      <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    ) : (
                      <span className="truncate">{JSON.stringify(log.data)}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
