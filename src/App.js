import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const socket = io(API_BASE, { transports: ['websocket', 'polling'] });

function LogsViewer() {
  const [logs, setLogs] = useState("");
  const logsRef = useRef(null);

  useEffect(() => {
    // Fetch initial logs on mount
    fetch(`${API_BASE}/logs`)
      .then(res => res.json())
      .then(data => setLogs(data.logs || ""));

    // Socket event handlers
    socket.on('connect', () => console.log('Socket connected'));
    socket.on('disconnect', () => console.log('Socket disconnected'));
    socket.on('log_update', (data) => {
      setLogs(prevLogs => prevLogs ? prevLogs + "\n" + data.log : data.log);
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('log_update');
    };
  }, []);

  // Scroll textarea to bottom when logs change
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Server Logs (Live)</h2>
      <textarea
        ref={logsRef}
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
        // Optionally clear inputs
        // setEmail('');
        // setPassword('');
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

      <button type="button" onClick={handleStart}>Start Bot</button>
      <br /><br />

      <button
        type="button"
        onClick={handleStop}
        style={{ backgroundColor: '#f44336', color: 'white' }}
      >
        Stop Bot
      </button>

      <p>{status}</p>
      <p><strong>Gem Status:</strong> {gemStatus}</p>

      <LogsViewer />
    </div>
  );
}

export default App;
