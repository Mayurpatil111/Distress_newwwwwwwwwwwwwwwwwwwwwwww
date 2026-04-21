import { useState } from "react";

export default function Login({ onLogin }) {
  const LOGIN_URL = "https://kml-backend-production-501c.up.railway.app/api/login/images";

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!user.trim() || !pass) {
      setErr("Please enter username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ username: user.trim(), password: pass }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Login failed (HTTP ${res.status})`);
      }
      onLogin?.({
        user: json.username || user.trim(),
        token: json.token,
        images: Array.isArray(json.images) ? json.images : [],
      });
    } catch (e2) {
      setErr(e2?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "12px",
            background: "linear-gradient(135deg, #1e40af, #3b82f6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(59,130,246,0.35)",
          }}>
            <svg viewBox="0 0 20 20" fill="none" style={{ width: "22px", height: "22px" }}>
              <path d="M2 10 Q6 4 10 10 Q14 16 18 10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
              RoadScan AI
            </h1>
            <p style={{ fontSize: "12px", color: "#64748b", marginTop: 4 }}>
              Sign in to continue
            </p>
          </div>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: 6 }}>
              Username
            </label>
            <input
              className="filter-select"
              style={{ width: "100%", padding: "10px 12px", fontSize: "13px" }}
              autoComplete="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="Enter username"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: 6 }}>
              Password
            </label>
            <input
              className="filter-select"
              style={{ width: "100%", padding: "10px 12px", fontSize: "13px" }}
              type="password"
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          {err && (
            <div style={{
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#dc2626",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12,
              fontWeight: 700,
            }}>
              {err}
            </div>
          )}

          <button type="submit" className="analyze-btn" style={{ marginTop: 4 }} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>
            This app uses the backend login API to authenticate.
          </p>
        </form>
      </div>
    </div>
  );
}
