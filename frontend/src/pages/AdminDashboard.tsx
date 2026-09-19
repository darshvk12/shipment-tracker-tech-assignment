import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchShipments, ShipmentFilters, deleteShipment } from "../api";
import { Shipment, STATUS_LABELS, STATUS_VALUES } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { CreateShipmentForm } from "../components/CreateShipmentForm";
import { ShipmentDetail } from "../components/ShipmentDetail";
import { EditShipmentForm } from "../components/EditShipmentForm";
import { ToastContainer, ToastMessage, ToastType } from "../components/Toast";
import { AnalyticsDashboard } from "../components/AnalyticsDashboard";
import { formatDate } from "../utils";

export function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const activeTab = searchParams.get("tab") === "shipments" ? "shipments" : "overview";
  const setActiveTab = (tab: "overview" | "shipments") => setSearchParams({ tab });
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("oldest");
  const [timeRange, setTimeRange] = useState<"Today" | "7D" | "30D" | "ALL" | "CUSTOM">("ALL");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingTable, setIsExportingTable] = useState(false);
  
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

  // Client-side sorting for the table
  const sortedShipments = [...shipments].sort((a, b) => {
    // Sort by referenceNumber (e.g., NGK-2026-0001)
    // Oldest first = ascending order (0001, 0002, 0003)
    // Newest first = descending order (0003, 0002, 0001)
    return sortOrder === "oldest" 
      ? a.referenceNumber.localeCompare(b.referenceNumber)
      : b.referenceNumber.localeCompare(a.referenceNumber);
  });

  // Client-side date filtering for Analytics
  const analyticsShipments = useMemo(() => {
    if (timeRange === "ALL") return shipments;
    if (timeRange === "CUSTOM") {
      const start = customStart ? new Date(customStart) : new Date(0);
      start.setHours(0, 0, 0, 0);
      const end = customEnd ? new Date(customEnd) : new Date();
      end.setHours(23, 59, 59, 999);
      return shipments.filter(s => {
        const d = new Date(s.createdAt);
        return d >= start && d <= end;
      });
    }
    const cutoff = new Date();
    if (timeRange === "Today") {
      cutoff.setHours(0, 0, 0, 0);
    } else {
      cutoff.setDate(cutoff.getDate() - (timeRange === "7D" ? 7 : 30));
    }
    return shipments.filter(s => new Date(s.createdAt) >= cutoff);
  }, [shipments, timeRange, customStart, customEnd]);

  const exportToPDF = async () => {
    setIsExporting(true);
    showToast("Generating PDF... this may take a moment", "success");
    try {
      const element = document.getElementById("analytics-export-target");
      if (!element) throw new Error("Dashboard not found");
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Executive_Dashboard.pdf");
      
      showToast("PDF downloaded successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to generate PDF", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const exportTableToPDF = () => {
    setIsExportingTable(true);
    try {
      const pdf = new jsPDF("l", "mm", "a4"); 
      
      const headers = [["Reference", "Origin", "Destination", "Status", "Expected Delivery", "Updated"]];
      const data = sortedShipments.map(s => [
        s.referenceNumber,
        s.origin,
        s.destination,
        s.currentStatus,
        formatDate(s.expectedDeliveryDate),
        formatDate(s.updatedAt)
      ]);
      
      // Add a simple title on the first page
      pdf.setFontSize(16);
      pdf.text("Shipments List", 14, 15);

      autoTable(pdf, {
        head: headers,
        body: data,
        startY: 20,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246] }, // blue-500
        margin: { top: 20 },
      });

      pdf.save("Shipments_List.pdf");
      showToast("PDF downloaded successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to generate PDF", "error");
    } finally {
      setIsExportingTable(false);
    }
  };

  const exportTableToCSV = () => {
    try {
      const headers = ["Reference", "Origin", "Destination", "Status", "Expected Delivery", "Updated"];
      const rows = sortedShipments.map(s => [
        s.referenceNumber,
        `"${s.origin}"`,
        `"${s.destination}"`,
        s.currentStatus,
        formatDate(s.expectedDeliveryDate),
        formatDate(s.updatedAt)
      ]);
      
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "Shipments_List.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("CSV downloaded successfully");
    } catch (err) {
      console.error(err);
      showToast("Failed to generate CSV", "error");
    }
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>Nagarkot Forwarders</span>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} 
            onClick={() => setActiveTab('overview')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'shipments' ? 'active' : ''}`} 
            onClick={() => setActiveTab('shipments')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            Shipments
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className={`main-header ${activeTab === 'overview' ? 'dashboard-header-mode' : 'dashboard-header-mode'}`}>
          {activeTab === 'overview' ? (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginBottom: timeRange === 'CUSTOM' ? '16px' : '0' }}>
                <div className="header-titles">
                  <h2>Executive Dashboard</h2>
                  <p className="header-subtitle">Real-time shipment tracking and performance metrics.</p>
                </div>
                <div className="header-actions">
                  <div className="segmented-control">
                    <button className={timeRange === 'Today' ? 'active' : ''} onClick={() => setTimeRange('Today')}>Today</button>
                    <button className={timeRange === '7D' ? 'active' : ''} onClick={() => setTimeRange('7D')}>7 Days</button>
                    <button className={timeRange === '30D' ? 'active' : ''} onClick={() => setTimeRange('30D')}>30 Days</button>
                    <button className={timeRange === 'ALL' ? 'active' : ''} onClick={() => setTimeRange('ALL')}>All Time</button>
                    <button className={timeRange === 'CUSTOM' ? 'active' : ''} onClick={() => setTimeRange('CUSTOM')}>Custom</button>
                  </div>
                  <button className="btn-secondary" onClick={exportToPDF} disabled={isExporting}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    {isExporting ? "Exporting..." : "Export PDF"}
                  </button>
                </div>
              </div>
              {timeRange === 'CUSTOM' && (
                <div className="custom-date-picker">
                  <div className="date-input-group">
                    <label>Start Date</label>
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                  </div>
                  <div className="date-input-group">
                    <label>End Date</label>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="header-titles">
                <h2>Shipment Management</h2>
              </div>
              <div className="header-actions">
                <button className="btn-secondary" onClick={exportTableToCSV}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Export CSV
                </button>
                <button className="btn-secondary" onClick={exportTableToPDF} disabled={isExportingTable}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  {isExportingTable ? "Exporting..." : "Export PDF"}
                </button>
                <button className="btn-primary" onClick={() => setShowCreate(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  New Shipment
                </button>
              </div>
            </>
          )}
        </header>

        <div className="content-area">
          {activeTab === 'overview' ? (
            <>
              {loading ? (
                <p className="muted">Loading analytics…</p>
              ) : (
                <div id="analytics-export-target" style={{ padding: '10px', background: '#f8fafc' }}>
                  <AnalyticsDashboard shipments={analyticsShipments} onViewAll={() => setActiveTab('shipments')} />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="toolbar advanced-toolbar">
                <div className="toolbar-search">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input
                    className="search-input"
                    placeholder="Search reference, origin, destination…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <div className="toolbar-controls">
                  <div className="toolbar-group">
                    <span className="toolbar-label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                      Filters:
                    </span>
                    <select className="toolbar-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="ALL">All Statuses</option>
                      {STATUS_VALUES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="toolbar-separator"></div>
                  
                  <div className="toolbar-group">
                    <span className="toolbar-label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                      Sort:
                    </span>
                    <select className="toolbar-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && <div className="error">{error}</div>}
              {loading && <p className="muted">Loading shipments…</p>}

              {!loading && shipments.length === 0 && (
                <div className="empty-state">No shipments match your filters yet.</div>
              )}

              {!loading && shipments.length > 0 && (
                <div id="table-export-target" className="table-container" style={{ padding: '10px', background: '#ffffff', borderRadius: '12px' }}>
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
              {sortedShipments.map((s) => (
                <tr key={s.id} onClick={() => setSelectedId(s.id)} className="clickable-row">
                  <td><span className="mono">{s.referenceNumber}</span></td>
                  <td>{s.origin}</td>
                  <td>{s.destination}</td>
                  <td>
                    <StatusBadge status={s.currentStatus} />
                  </td>
                  <td>{formatDate(s.expectedDeliveryDate)}</td>
                  <td>
                    {formatDate(s.updatedAt)}{" "}
                    <span className="muted">{new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn-icon btn-edit" 
                        onClick={() => setEditingShipment(s)}
                        title="Edit Shipment"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button 
                        className="btn-icon btn-delete" 
                        onClick={(e) => handleDeleteRow(s, e)}
                        title="Delete Shipment"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
            </>
          )}
        </div>
      </main>

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
