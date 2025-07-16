import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function LogsViewer() {
  const [logs, setLogs] = useState("");

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/logs`);
      const data = await res.json();
      setLogs(data.logs);
    } catch (error) {
      setLogs(`Error fetching logs: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000); // Fetch logs every 2 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Server Logs</h2>
      <textarea
        value={logs}
        readOnly
        style={{
          width: "100%",
          height: "300px",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          overflowY: "scroll",
          border: "1px solid #ccc",
          padding: "0.5rem",
        }}
      />
    </div>
  );
}

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [gemStatus, setGemStatus] = useState('🔍 Waiting...');

  const handleStart = async () => {
    if (!email.trim() || !password.trim()) {
      setStatus("⚠️ Please enter both email and password.");
      return;
    }

    setStatus("⏳ Starting bot...");

    try {
      const response = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      if (response.ok) {
        setStatus(`✅ ${result.status}`);
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setStatus("❌ Could not connect to backend.");
    }
  };

  const handleStop = async () => {
    setStatus("⏹ Stopping bot...");

    try {
      const response = await fetch(`${API_BASE}/stop`, {
        method: 'POST'
      });

      const result = await response.json();
      if (response.ok) {
        setStatus(`✅ ${result.status}`);
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      console.error("❌ Stop error:", err);
      setStatus("❌ Could not connect to backend.");
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/status`);
        const result = await response.json();

        if (result.gem_found) {
          setGemStatus("💎 Gem found!");
        } else {
          setGemStatus("🔍 No gem yet.");
        }
      } catch (err) {
        console.error("Gem status error:", err);
        setGemStatus("⚠️ Error checking gem status.");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <h1>Rise of Kingdoms Bot</h1>

      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={handleStart}>Start Bot</button>
      <br /><br />

      <button
        onClick={handleStop}
        style={{ backgroundColor: '#f44336', color: 'white' }}
      >
        Stop Bot
      </button>

      <p>{status}</p>
      <p><strong>Gem Status:</strong> {gemStatus}</p>

      {/* Logs viewer here */}
      <LogsViewer />
    </div>
  );
}

export default App;
