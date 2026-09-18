import { useEffect, useState, useCallback } from "react";
import { fetchShipments, ShipmentFilters, deleteShipment } from "../api";
import { Shipment, STATUS_LABELS, STATUS_VALUES } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { CreateShipmentForm } from "../components/CreateShipmentForm";
import { ShipmentDetail } from "../components/ShipmentDetail";
import { EditShipmentForm } from "../components/EditShipmentForm";
import { ToastContainer, ToastMessage, ToastType } from "../components/Toast";

export function AdminDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: ShipmentFilters = { search };
      if (statusFilter !== "ALL") filters.status = statusFilter;
      const data = await fetchShipments(filters);
      setShipments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shipments");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  function handleCreated(shipment: Shipment) {
    setShipments((prev) => [shipment, ...prev]);
  }

  function handleUpdated(updated: Shipment) {
    setShipments((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
  }

  function handleDeleted(id: number) {
    setShipments((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  async function handleDeleteRow(shipment: Shipment, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${shipment.referenceNumber}?`)) return;
    try {
      await deleteShipment(shipment.id);
      handleDeleted(shipment.id);
      showToast("Shipment deleted successfully");
    } catch (err) {
      showToast("Failed to delete shipment", "error");
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Nagarkot Forwarders Pvt Ltd shipments</h1>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          New Shipment
        </button>
      </header>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search reference, origin, destination…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Statuses</option>
          {STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading shipments…</p>}

      {!loading && shipments.length === 0 && (
        <div className="empty-state">No shipments match your filters yet.</div>
      )}

      {!loading && shipments.length > 0 && (
        <div className="table-container">
          <table className="shipment-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Expected delivery</th>
                <th>Updated</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} onClick={() => setSelectedId(s.id)} className="clickable-row">
                  <td><span className="mono">{s.referenceNumber}</span></td>
                  <td>{s.origin}</td>
                  <td>{s.destination}</td>
                  <td>
                    <StatusBadge status={s.currentStatus} />
                  </td>
                  <td>{new Date(s.expectedDeliveryDate).toLocaleDateString()}</td>
                  <td>
                    {new Date(s.updatedAt).toLocaleDateString()}{" "}
                    <span className="muted">{new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                      <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: "0.8rem" }} onClick={() => setEditingShipment(s)}>Edit</button>
                      <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: "0.8rem", color: "#dc2626", borderColor: "#fecaca", background: "#fef2f2" }} onClick={(e) => handleDeleteRow(s, e)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateShipmentForm 
          onCreated={(s) => {
            handleCreated(s);
            setShowCreate(false);
            showToast("Shipment created successfully");
          }} 
          onClose={() => setShowCreate(false)} 
        />
      )}
      
      {editingShipment && (
        <EditShipmentForm
          shipment={editingShipment}
          onUpdated={(updated) => {
            handleUpdated(updated);
            setEditingShipment(null);
            showToast("Shipment updated successfully");
          }}
          onClose={() => setEditingShipment(null)}
        />
      )}

      {selectedId !== null && (
        <ShipmentDetail
          shipmentId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={(s) => {
            handleUpdated(s);
            showToast("Shipment updated successfully");
          }}
          onDeleted={(id) => {
            handleDeleted(id);
            showToast("Shipment deleted successfully");
          }}
        />
      )}
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
