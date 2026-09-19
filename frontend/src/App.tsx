import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AdminDashboard } from "./pages/AdminDashboard";
import { PublicTracker } from "./pages/PublicTracker";
import { Login } from "./pages/Login";
import { Layout } from "./components/Layout";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = !!localStorage.getItem("adminToken");
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<PublicTracker />} />
          <Route path="login" element={<Login />} />
          <Route 
            path="admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
