import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";

export function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await login(username, password);
      if (data.success) {
        localStorage.setItem("adminToken", data.token);
        navigate("/admin");
      }
    } catch (err) {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ background: "white", padding: "48px", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ background: "#3b82f6", color: "white", width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.5rem", margin: "0 auto 16px" }}>N</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>Admin Portal</h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "16px" }}>Sign in to manage shipments</p>
          <div style={{ background: "#f1f5f9", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", color: "#475569", border: "1px dashed #cbd5e1" }}>
            <strong>Demo Credentials:</strong><br />
            Username: <code>admin</code><br />
            Password: <code>password123</code>
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "0.9rem", color: "#334155" }}>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "1rem" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "0.9rem", color: "#334155" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", padding: "12px", paddingRight: "40px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "1rem" }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#64748b", display: "flex", alignItems: "center" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <div style={{ color: "#ef4444", fontSize: "0.9rem", textAlign: "center", background: "#fef2f2", padding: "12px", borderRadius: "8px" }}>{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: "100%", padding: "14px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", marginTop: "8px" }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
