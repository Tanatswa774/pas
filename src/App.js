import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = "https://b14527d1e5d9.ngrok-free.app";

// 🔒 Hardcoded allowed usernames
const ALLOWED_USERS = ["odinrise12", "bob", "charlie"]; // 👈 You can add/remove usernames here
const STORAGE_KEY = "rokbot_active_user";

function LogsViewer() {
  const [logs, setLogs] = useState("");
  const logsRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/logs`, {
          headers: {
            "ngrok-skip-browser-warning": "true"
          }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setLogs(data.logs || "No logs.");
      } catch (err) {
        console.error("❌ Log fetch error:", err);
        setLogs("❌ Error fetching logs. Trying again...");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [loginError, setLoginError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [gemStatus, setGemStatus] = useState('🔍 Waiting...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const activeUser = localStorage.getItem(STORAGE_KEY);
    if (activeUser && ALLOWED_USERS.includes(activeUser)) {
      setUsername(activeUser);
      setAuthenticated(true);
    }

    // Clean up on close
    const handleUnload = () => {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current === username) {
        localStorage.removeItem(STORAGE_KEY);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [username]);

  const handleLogin = () => {
    const name = username.trim().toLowerCase();
    if (!name) {
      setLoginError("⚠️ Please enter a username.");
      return;
    }

    if (!ALLOWED_USERS.includes(name)) {
      setLoginError("🚫 Username not allowed.");
      return;
    }

    const activeUser = localStorage.getItem(STORAGE_KEY);
    if (activeUser && activeUser !== name) {
      setLoginError(`❌ Another user (${activeUser}) is already online.`);
      return;
    }

    if (activeUser === name) {
      setLoginError("❌ This user is already online.");
      return;
    }

    localStorage.setItem(STORAGE_KEY, name);
    setAuthenticated(true);
    setLoginError('');
  };

  const handleStart = async () => {
    if (!email.trim() || !password.trim()) {
      setStatus("⚠️ Please enter both email and password.");
      return;
    }

    setStatus("⏳ Starting bot...");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      if (response.ok) {
        setStatus(`✅ ${result.status}`);
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setStatus("❌ Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setStatus("⏹ Stopping bot and restarting server...");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/stop`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      const result = await response.json();
      if (response.ok) {
        setStatus("✅ Bot stopped. Restarting server...");
        setTimeout(() => {
          setStatus("🔁 Server should be back shortly.");
          setEmail('');
          setPassword('');
        }, 3000);
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      console.error("Stop error:", err);
      setStatus("❌ Could not connect to backend. It may be restarting.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/status`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        const result = await response.json();
        setGemStatus(result.gem_found ? "💎 Gem found!" : "🔍 No gem yet.");
      } catch (err) {
        setGemStatus("⚠️ Error checking gem status.");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!authenticated) {
    return (
      <div className="App">
        <h1>Enter Username</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <br /><br />
        <button onClick={handleLogin}>Login</button>
        {loginError && <p style={{ color: "red" }}>{loginError}</p>}
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Rise of Kingdoms Bot</h1>

      <input
        type="email"
        placeholder="Enter email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        disabled={loading}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        disabled={loading}
      />
      <br /><br />

      <button type="button" onClick={handleStart} disabled={loading}>
        {loading ? "Starting..." : "Start Bot"}
      </button>
      <br /><br />

      <button
        type="button"
        onClick={handleStop}
        style={{ backgroundColor: '#f44336', color: 'white' }}
        disabled={loading}
      >
        {loading ? "Stopping..." : "Stop Bot"}
      </button>

      <p>{status}</p>
      <p><strong>Gem Status:</strong> {gemStatus}</p>

      <LogsViewer />
    </div>
  );
}

export default App;
