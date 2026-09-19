import { useEffect, useState } from "react";
import { Package, Truck, Clock, AlertTriangle, ArrowLeft, RefreshCw, Printer } from "lucide-react";
import { formatDate } from "../utils";
import { fetchShipment, updateShipmentStatus, deleteShipment } from "../api";
import { Shipment, ShipmentStatus, STATUS_LABELS, STATUS_VALUES, AVAILABLE_NEXT_STATUSES } from "../types";
import { StatusBadge } from "./StatusBadge";
import { TrackingTimeline } from "./TrackingTimeline";
import { EditShipmentForm } from "./EditShipmentForm";

interface Props {
  shipmentId: number;
  onClose: () => void;
  onUpdated: (shipment: Shipment) => void;
  onDeleted: (id: number) => void;
}

export function ShipmentDetail({ shipmentId, onClose, onUpdated, onDeleted }: Props) {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<ShipmentStatus>("BOOKED");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  async function handleDelete() {
    if (!shipment || !confirm("Are you sure you want to delete this shipment?")) return;
    try {
      await deleteShipment(shipment.id);
      onDeleted(shipment.id);
    } catch (err) {
      alert("Failed to delete shipment");
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchShipment(shipmentId)
      .then((s) => {
        if (cancelled) return;
        setShipment(s);
        const nextStatuses = AVAILABLE_NEXT_STATUSES[s.currentStatus] || [];
        setNewStatus(nextStatuses.length > 0 ? nextStatuses[0] : s.currentStatus);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [shipmentId]);

  async function handleUpdateStatus() {
    if (!shipment) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateShipmentStatus(shipment.id, newStatus, note || undefined);
      setShipment(updated);
      setNote("");
      // Reset newStatus to the first valid option for the newly updated status!
      const nextStatuses = AVAILABLE_NEXT_STATUSES[updated.currentStatus] || [];
      setNewStatus(nextStatuses.length > 0 ? nextStatuses[0] : updated.currentStatus);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {loading && <p>Loading…</p>}
        {error && !shipment && <div className="error">{error}</div>}
        {shipment && (
          <>
            <div className="detail-header">
              <div>
                <h2>{shipment.referenceNumber}</h2>
                <p className="muted">
                  {shipment.origin} → {shipment.destination}
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <StatusBadge status={shipment.currentStatus} />
                <button className="btn-secondary" onClick={() => setShowEdit(true)} style={{ padding: "6px 12px" }}>Edit</button>
                <button className="btn-secondary" onClick={handleDelete} style={{ padding: "6px 12px", color: "#dc2626", borderColor: "#fecaca", background: "#fef2f2" }}>Delete</button>
              </div>
            </div>

            <dl className="detail-grid">
              <dt>Expected Delivery</dt>
              <dd>{formatDate(shipment.expectedDeliveryDate)}</dd>
              <dt>Carrier</dt>
              <dd>{shipment.carrier || "—"}</dd>
              <dt>Notes</dt>
              <dd>{shipment.notes || "—"}</dd>
            </dl>

            {(AVAILABLE_NEXT_STATUSES[shipment.currentStatus] || []).length > 0 && (
              <>
                <h3>Update status</h3>
                <div className="form-row" style={{ flexWrap: "wrap" }}>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as ShipmentStatus)}>
                    {AVAILABLE_NEXT_STATUSES[shipment.currentStatus].map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="optional note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <button className="btn-primary" onClick={handleUpdateStatus} disabled={submitting}>
                    {submitting ? "Saving…" : "Update"}
                  </button>
                </div>
                {error && <div className="error">{error}</div>}
              </>
            )}

            <h3>History</h3>
            <TrackingTimeline shipment={shipment} />

            <div className="form-actions">
              <button className="btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
            {showEdit && (
              <EditShipmentForm
                shipment={shipment}
                onUpdated={(updated) => {
                  setShipment(updated);
                  setShowEdit(false);
                  onUpdated(updated);
                }}
                onClose={() => setShowEdit(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
