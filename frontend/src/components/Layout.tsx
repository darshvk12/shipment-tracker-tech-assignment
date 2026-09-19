import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem("adminToken");

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <nav style={{ 
        background: "rgba(255, 255, 255, 0.9)", 
        backdropFilter: "blur(12px)",
        padding: "16px 32px", 
        borderBottom: "1px solid #e2e8f0", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e293b" }}>Nagarkot Forwarders Pvt Ltd</span>
        </Link>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link to="/" style={{ textDecoration: "none", color: location.pathname === "/" ? "#3b82f6" : "#64748b", fontWeight: 600 }}>Track Shipment</Link>
          {isAuthenticated ? (
            <>
              <Link to="/admin" style={{ textDecoration: "none", color: location.pathname === "/admin" ? "#3b82f6" : "#64748b", fontWeight: 600 }}>Dashboard</Link>
              <button onClick={handleLogout} style={{ background: "transparent", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, color: "#64748b" }}>Logout</button>
            </>
          ) : (
            <Link to="/login" style={{ textDecoration: "none", color: location.pathname === "/login" ? "#3b82f6" : "#64748b", fontWeight: 600 }}>Admin Login</Link>
          )}
        </div>
      </nav>
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </main>

    </div>
  );
}
