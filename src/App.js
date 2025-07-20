import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = "https://b14527d1e5d9.ngrok-free.app";

// 🔒 Hardcoded allowed usernames
const ALLOWED_USERS = ["alice", "bob", "charlie"]; // 👈 Add more here
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
    const storedUser = localStorage.getItem(STORAGE_KEY);
    const activeUsers = JSON.parse(localStorage.getItem("active_users") || "{}");

    if (storedUser && ALLOWED_USERS.includes(storedUser) && activeUsers[storedUser]) {
      setUsername(storedUser);
      setAuthenticated(true);
    }

    const handleUnload = () => {
      const activeUsers = JSON.parse(localStorage.getItem("active_users") || "{}");
      const current = localStorage.getItem(STORAGE_KEY);
      if (current && activeUsers[current]) {
        delete activeUsers[current];
        localStorage.setItem("active_users", JSON.stringify(activeUsers));
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

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

    const activeUsers = JSON.parse(localStorage.getItem("active_users") || "{}");

    if (activeUsers[name]) {
      setLoginError("❌ This user is already online.");
      return;
    }

    // Mark user as active
    activeUsers[name] = true;
    localStorage.setItem("active_users", JSON.stringify(activeUsers));
    localStorage.setItem(STORAGE_KEY, name);

    setAuthenticated(true);
    setLoginError('');
  };

  const handleLogout = () => {
    const activeUsers = JSON.parse(localStorage.getItem("active_users") || "{}");
    if (activeUsers[username]) {
      delete activeUsers[username];
      localStorage.setItem("active_users", JSON.stringify(activeUsers));
    }
    localStorage.removeItem(STORAGE_KEY);
    setAuthenticated(false);
    setUsername('');
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
    const interval = setInterva
