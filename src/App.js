import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import bestImage from './best.png'; // Make sure this image exists in the src folder

const API_BASE = "https://cc1a9d910e47.ngrok-free.app";

// Hardcoded login credentials: username → { loginPassword, email, botPassword }
const USER_CREDENTIALS = {
  "Odin12": {
    loginPassword: "OdinLoginPass123",
    email: "ofodinrise@gmail.com",
    password: "RiseOdin1234@"
  },
  "Keep": {
    loginPassword: "KeepSecret!",
    email: "fjbrok1992@gmail.com",
    password: "maormoyal12"
  },
  "Verga.": {
    loginPassword: "VergaSecure",
    email: "vergasovdaniel@gmail.com",
    password: "generals2330"
  },
  "Keep1": {
    loginPassword: "Keep1Access",
    email: "mgynexthago@gmail.com",
    password: "maormoyal12"
  }
};

function LogsViewer({ botStarted, email, onLogout }) {
  const [logs, setLogs] = useState("Bot is not running. Press Start Bot to start it.");
  const [showBest, setShowBest] = useState(false);
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
        <div>
          <button
            onClick={() => setShowBest(true)}
            style={{
              marginRight: '10px',
              backgroundColor: '#007BFF',
              color: '#fff',
              padding: '6px 12px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Best Practice
          </button>
          <button
            onClick={onLogout}
            style={{
              backgroundColor: '#555',
              color: '#fff',
              padding: '6px 12px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {showBest && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#fff',
            color: '#000',  // <-- This ensures text is visible
            padding: '2rem',
            borderRadius: '10px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80%',
            overflowY: 'auto',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            <h3>Best Practice:</h3>
            <p>Configure the Blue Presets</p>
            <p>
              Set your commanders for the blue presets to gather gems.<br />
              The number of presets must match the number of marches you are able to deploy.
            </p>
            <p>An example is shown in the image below:</p>
            <img src={bestImage} alt="Best Practice Example" style={{ maxWidth: '100%', margin: '1rem 0' }} />
            <p><strong>Note:</strong> T1 Cavalry units are the fastest moving troops.</p>
            <button
              onClick={() => setShowBest(false)}
              style={{
                marginTop: '1rem',
                backgroundColor: '#888',
                color: '#fff',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

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
          marginTop: '1rem'
        }}
      />
    </div>
  );
}

function App() {
  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
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

    if (inputPassword !== creds.loginPassword) {
      setStatus("❌ Incorrect password.");
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
    setInputPassword('');
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
          <input
            type="password"
            placeholder="Enter your password"
            value={inputPassword}
            onChange={e => setInputPassword(e.target.value)}
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
