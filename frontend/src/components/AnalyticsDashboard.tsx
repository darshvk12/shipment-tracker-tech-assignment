import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Shipment, STATUS_LABELS } from "../types";

interface AnalyticsDashboardProps {
  shipments: Shipment[];
}

const COLORS: Record<string, string> = {
  BOOKED: "#6366f1",
  IN_TRANSIT: "#3b82f6",
  CUSTOMS_HOLD: "#f59e0b",
  OUT_FOR_DELIVERY: "#8b5cf6",
  DELIVERED: "#10b981",
  EXCEPTION: "#ef4444"
};

export function AnalyticsDashboard({ shipments }: AnalyticsDashboardProps) {
  const metrics = useMemo(() => {
    const total = shipments.length;
    const delivered = shipments.filter(s => s.currentStatus === "DELIVERED").length;
    const exceptions = shipments.filter(s => s.currentStatus === "EXCEPTION" || s.currentStatus === "CUSTOMS_HOLD").length;
    const active = total - delivered - exceptions;

    // Status distribution for PieChart
    const statusCounts = shipments.reduce((acc, s) => {
      acc[s.currentStatus] = (acc[s.currentStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
      statusKey: status,
      value: count
    }));

    // Volume over time (Expected Delivery Date) for BarChart
    const dateCounts = shipments.reduce((acc, s) => {
      // Group by short date string (e.g., "Sep 18")
      const date = new Date(s.expectedDeliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sort by actual date
    const volumeData = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 7); // Show max 7 days for clean chart

    return { total, active, delivered, exceptions, statusData, volumeData };
  }, [shipments]);

  if (shipments.length === 0) return null;

  return (
    <div className="analytics-dashboard">
      <div className="metrics-cards">
        <div className="metric-card">
          <div className="metric-title">Total Shipments</div>
          <div className="metric-value">{metrics.total}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Active (In Progress)</div>
          <div className="metric-value" style={{ color: "#3b82f6" }}>{metrics.active}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Completed</div>
          <div className="metric-value" style={{ color: "#10b981" }}>{metrics.delivered}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Issues / Holds</div>
          <div className="metric-value" style={{ color: "#ef4444" }}>{metrics.exceptions}</div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-box">
          <h3>Status Distribution</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.statusKey] || "#cbd5e1"} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} shipments`, 'Count']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            {metrics.statusData.map((entry) => (
              <div key={entry.name} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: COLORS[entry.statusKey] || "#cbd5e1" }}></span>
                <span className="legend-label">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-box">
          <h3>Expected Deliveries</h3>
          <div style={{ height: 250, marginTop: "20px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Deliveries" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
