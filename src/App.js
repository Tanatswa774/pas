import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = "https://40f41e172264.ngrok-free.app";

// Map username → { email, password }
const USER_CREDENTIALS = {
  "Odin12": {
    email: "ofodinrise@gmail.com",
    password: "RiseOdin1234@"
  },
  "Keep": {
    email: "fjbrok1992@gmail.com",
    password: "maormoyal12"
  },
  "Verga.": {
    email: "vergasovdaniel@gmail.com",
    password: "generals2330"
  },
  "Keep1": {
    email: "mgynexthago@gmail.com",
    password: "maormoyal12"
  }

};

function LogsViewer({ botStarted, email, onLogout }) {
  const [logs, setLogs] = useState("Bot is not running. Press Start Bot to start it.");
  const logsRef = useRef(null);

  useEffect(() => {
    if (!botStarted) {
      setLogs("Bot is not running. Press Start Bot to start it.");
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
          },
          body: JSON.stringify({ email })
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>GAME LOGS</h2>
        <button onClick={onLogout} style={{ backgroundColor: '#555', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
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
  const [inputUsername, setInputUsername] = useState('');
  const [status, setStatus] = useState('');
  const [gemStatus, setGemStatus] = useState('🔍 Waiting...');
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [botStarted, setBotStarted] = useState(false);

  const handleLogin = () => {
    const creds = USER_CREDENTIALS[inputUsername.trim()];
    if (!creds) {
      setStatus("❌ Unauthorized username.");
      return;
    }

    setStatus("✅ Access granted.");
    setAuthenticated(true);
    setUserEmail(creds.email);
    setUserPassword(creds.password);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setInputUsername('');
    setUserEmail('');
    setUserPassword('');
    setStatus('');
    setBotStarted(false);
    setGemStatus('🔍 Waiting...');
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
        body: JSON.stringify({ email: userEmail, password: userPassword })
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
        body: JSON.stringify({ email: userEmail })
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
        const response = await fetch(`${API_BASE}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ email: userEmail })
        });
        const result = await response.json();
        setGemStatus(result.gem_found ? "💎 Gem found!" : "🔍 No gem yet.");
      } catch (err) {
        setGemStatus("⚠️ Error checking gem status.");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [authenticated, userEmail]);

  return (
    <div className="App">
      <h1>Gem Collector Bot</h1>

      {!authenticated ? (
        <>
          <input
            type="text"
            placeholder="Enter your username"
            value={inputUsername}
            onChange={e => setInputUsername(e.target.value)}
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

          <LogsViewer botStarted={botStarted} email={userEmail} onLogout={handleLogout} />
        </>
      )}
    </div>
  );
}

export default App;
