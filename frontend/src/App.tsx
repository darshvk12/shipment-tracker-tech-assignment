import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminDashboard } from "./pages/AdminDashboard";
import { PublicTracker } from "./pages/PublicTracker";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicTracker />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
