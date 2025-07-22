import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import logo from './rok_logo.png'; // Background logo

const API_BASE = "https://b14527d1e5d9.ngrok-free.app";

const ALLOWED_USERS = {
  "ofodinrise@gmail.com": "RiseOdin1234@",
  "tester@domain.com": "AnotherSecret456",
  "vergasovdaniel@gmail.com": "general2330",
};

function LogsViewer({ botStarted, email }) {
  const [logs, setLogs] = useState("Bot is not running. Press Start Bot to start it.");
  const logsRef = useRef(null);

  useEffect(() => {
    if (!botStarted) {
      setLogs("Bot is not running. Press Start Bot to start it.");
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/logs?email=${email}`, {
          headers: { "ngrok-skip-browser-warning": "true" }
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
  }, [botStarted, email]);

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
  const [inputEmail, setInputEmail] = useState('');
  const [status, setStatus] = useState('');
  const [gemStatus, setGemStatus] = useState('🔍 Waiting...');
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userPassword, setUserPassword] = useState('');
  const [botStarted, setBotStarted] = useState(false);

  const handleLogin = () => {
    const password = ALLOWED_USERS[inputEmail.trim()];
    if (!password) {
      setStatus("❌ Unauthorized email.");
      return;
    }

    setStatus("✅ Access granted.");
    setAuthenticated(true);
    setUserPassword(password);
  };

  const handleStart = async () => {
    setStatus("⏳ Starting bot...");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ email: inputEmail.trim(), password: userPassword })
      });

      const result = await response.json();
      if (response.ok) {
        setStatus(`✅ ${result.status}`);
        setBotStarted(true);
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      console.error("Start error:", err);
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
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ email: inputEmail.trim() })
      });

      const result = await response.json();
      if (response.ok) {
        setStatus("✅ Bot stopped. Restarting server...");
        setBotStarted(false);
        setTimeout(() => {
          setStatus("🔁 Server should be back shortly.");
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
    if (!authenticated) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/status?email=${inputEmail.trim()}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const result = await response.json();
        setGemStatus(result.gem_found ? "💎 Gem found!" : "🔍 No gem yet.");
      } catch (err) {
        setGemStatus("⚠️ Error checking gem status.");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [authenticated, inputEmail]);

  return (
    <>
      <div className="background-logo"></div>

      <div className="App">
        <h1>Gem Collector Bot</h1>

        {!authenticated ? (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={inputEmail}
              onChange={e => setInputEmail(e.target.value)}
              disabled={loading}
            />
            <br /><br />
            <button type="button" onClick={handleLogin} disabled={loading}>
              {loading ? "Checking..." : "Login"}
            </button>
            <p>{status}</p>
          </>
        ) : (
          <>
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

            <LogsViewer botStarted={botStarted} email={inputEmail.trim()} />
          </>
        )}
      </div>
    </>
  );
}

export default App;
