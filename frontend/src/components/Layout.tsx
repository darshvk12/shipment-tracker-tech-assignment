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
      <nav style={{ background: "#ffffff", padding: "16px 32px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/" style={{ textDecoration: "none", color: "#1e293b", fontWeight: 700, fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ background: "#3b82f6", color: "white", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>N</div>
          Nagarkot Forwarders
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
