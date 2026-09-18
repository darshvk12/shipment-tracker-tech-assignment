import { FormEvent, useState, useEffect } from "react";
import { createShipment, fetchNextReference } from "../api";
import { Shipment, STATUS_LABELS, STATUS_VALUES, ShipmentStatus } from "../types";

interface Props {
  onCreated: (shipment: Shipment) => void;
  onClose: () => void;
}

export function CreateShipmentForm({ onCreated, onClose }: Props) {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [status, setStatus] = useState<ShipmentStatus>("BOOKED");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [carrier, setCarrier] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRef, setLoadingRef] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchNextReference()
      .then((ref) => {
        if (!cancelled) setReferenceNumber(ref);
      })
      .catch((err) => console.error("Failed to load reference:", err))
      .finally(() => {
        if (!cancelled) setLoadingRef(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const shipment = await createShipment({
        referenceNumber,
        origin,
        destination,
        currentStatus: status,
        expectedDeliveryDate,
        carrier: carrier || undefined,
        notes: notes || undefined,
      });
      onCreated(shipment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shipment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New Shipment</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Reference number *
            <input
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder={`e.g. NGK-${new Date().getFullYear()}-0001`}
              required
              disabled={loadingRef}
            />
          </label>
          <div className="form-row">
            <label>
              Origin *
              <input value={origin} onChange={(e) => setOrigin(e.target.value)} required />
            </label>
            <label>
              Destination *
              <input value={destination} onChange={(e) => setDestination(e.target.value)} required />
            </label>
          </div>
          <div className="form-row">
            <label>
              Initial status
              <select value={status} onChange={(e) => setStatus(e.target.value as ShipmentStatus)}>
                {STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Expected delivery date *
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                required
              />
            </label>
          </div>
          <label>
            Carrier
            <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="optional" />
          </label>
          <label>
            Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="optional" />
          </label>

          {error && <div className="error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create shipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
