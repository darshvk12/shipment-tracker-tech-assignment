import { FormEvent, useState } from "react";
import { updateShipment } from "../api";
import { Shipment } from "../types";

interface Props {
  shipment: Shipment;
  onUpdated: (shipment: Shipment) => void;
  onClose: () => void;
}

export function EditShipmentForm({ shipment, onUpdated, onClose }: Props) {
  const [referenceNumber, setReferenceNumber] = useState(shipment.referenceNumber);
  const [origin, setOrigin] = useState(shipment.origin);
  const [destination, setDestination] = useState(shipment.destination);
  // date input requires YYYY-MM-DD
  const initialDate = new Date(shipment.expectedDeliveryDate).toISOString().split("T")[0];
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(initialDate);
  const [carrier, setCarrier] = useState(shipment.carrier || "");
  const [notes, setNotes] = useState(shipment.notes || "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const updated = await updateShipment(shipment.id, {
        referenceNumber,
        origin,
        destination,
        expectedDeliveryDate,
        carrier: carrier || undefined,
        notes: notes || undefined,
      });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update shipment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Shipment</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Reference number *
            <input
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              required
            />
          </label>
          <div className="form-row">
            <label>
              Origin *
              <input 
                value={origin} 
                onChange={(e) => setOrigin(e.target.value)} 
                placeholder="e.g. New York, USA"
                required 
              />
            </label>
            <label>
              Destination *
              <input 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)} 
                placeholder="e.g. London, UK"
                required 
              />
            </label>
          </div>
          <div className="form-row">
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
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
