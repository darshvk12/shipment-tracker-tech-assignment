import { useState } from "react";
import { fetchShipmentByReference } from "../api";
import { Shipment } from "../types";
import { TrackingTimeline } from "../components/TrackingTimeline";

export function PublicTracker() {
  const [reference, setReference] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) return;
    
    setLoading(true);
    setError(null);
    setShipment(null);

    try {
      const data = await fetchShipmentByReference(reference.trim());
      setShipment(data);
    } catch (err) {
      setError("Shipment not found. Please check your reference number and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app" style={{ maxWidth: "800px", margin: "0 auto", paddingTop: "48px" }}>
      <header className="app-header" style={{ justifyContent: "center", marginBottom: "48px" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Nagarkot Forwarders Pvt Ltd</h1>
          <p className="muted">Track your shipment status in real-time</p>
        </div>
      </header>

      <div className="modal" style={{ position: "relative", transform: "none", top: 0, left: 0, width: "100%", padding: "32px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", marginBottom: shipment || error ? "32px" : "0" }}>
          <input
            className="search-input"
            style={{ flex: 1, padding: "12px 16px", fontSize: "1.1rem" }}
            placeholder="Enter your reference number (e.g., NGK-2026-0001)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: "12px 24px", fontSize: "1.05rem" }}>
            {loading ? "Searching…" : "Track"}
          </button>
        </form>

        {error && <div className="error" style={{ textAlign: "center" }}>{error}</div>}

        {shipment && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px", padding: "24px", background: "#f8fafc", borderRadius: "12px" }}>
              <div>
                <span className="muted" style={{ display: "block", fontSize: "0.85rem", marginBottom: "4px" }}>Reference</span>
                <strong>{shipment.referenceNumber}</strong>
              </div>
              <div>
                <span className="muted" style={{ display: "block", fontSize: "0.85rem", marginBottom: "4px" }}>Expected Delivery</span>
                <strong>{new Date(shipment.expectedDeliveryDate).toLocaleDateString()}</strong>
              </div>
              <div>
                <span className="muted" style={{ display: "block", fontSize: "0.85rem", marginBottom: "4px" }}>Origin</span>
                <strong>{shipment.origin}</strong>
              </div>
              <div>
                <span className="muted" style={{ display: "block", fontSize: "0.85rem", marginBottom: "4px" }}>Destination</span>
                <strong>{shipment.destination}</strong>
              </div>
            </div>

            <h3 style={{ marginBottom: "16px" }}>Tracking History</h3>
            <div style={{ paddingLeft: "16px" }}>
              <TrackingTimeline shipment={shipment} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
