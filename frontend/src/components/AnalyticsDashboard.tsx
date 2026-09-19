import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Shipment, STATUS_LABELS } from "../types";

interface AnalyticsDashboardProps {
  shipments: Shipment[];
  onViewAll?: () => void;
}

const COLORS: Record<string, string> = {
  BOOKED: "#94a3b8", // Slate
  IN_TRANSIT: "#3b82f6", // Blue
  CUSTOMS_HOLD: "#f59e0b", // Amber
  OUT_FOR_DELIVERY: "#a855f7", // Purple
  DELIVERED: "#10b981", // Emerald
  EXCEPTION: "#ef4444" // Red
};

export function AnalyticsDashboard({ shipments, onViewAll }: AnalyticsDashboardProps) {
  const metrics = useMemo(() => {
    let total = 0, active = 0, delivered = 0, exceptions = 0;
    const statusData: Record<string, number> = {};
    const destinationData: Record<string, number> = {};
    const creationMap = new Map();
    // Pre-fill the last 7 days so the LineChart always draws a continuous line even with new data
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      creationMap.set(dateStr, 0);
    }

    const expectedMap = new Map();

    shipments.forEach(s => {
      if (s.currentStatus === 'DELIVERED') delivered++;
      else if (s.currentStatus === 'EXCEPTION') exceptions++;
      else active++;
      
      total++;

      statusData[s.currentStatus] = (statusData[s.currentStatus] || 0) + 1;
      
      const dest = s.destination.split(',')[0].trim();
      destinationData[dest] = (destinationData[dest] || 0) + 1;

      const cDate = new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (creationMap.has(cDate)) {
        creationMap.set(cDate, creationMap.get(cDate) + 1);
      }

      if (s.expectedDeliveryDate) {
        const eDate = new Date(s.expectedDeliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        expectedMap.set(eDate, (expectedMap.get(eDate) || 0) + 1);
      }
    });

    const mappedStatusData = Object.entries(statusData).map(([status, count]) => ({
      name: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
      statusKey: status,
      value: count
    }));

    const mappedDestinationData = Object.entries(destinationData)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const expectedTimeline = Array.from(expectedMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, count]) => ({ date, count }));

    const creationTrend = Array.from(creationMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const upcomingList = [...shipments]
      .filter(s => s.currentStatus !== 'DELIVERED' && s.expectedDeliveryDate)
      .filter(s => new Date(s.expectedDeliveryDate) <= threeDaysFromNow)
      .sort((a, b) => new Date(a.expectedDeliveryDate).getTime() - new Date(b.expectedDeliveryDate).getTime())
      .slice(0, 4);

    return { 
      total, 
      active, 
      delivered, 
      exceptions, 
      statusData: mappedStatusData, 
      destinationData: mappedDestinationData, 
      expectedTimeline, 
      creationTrend, 
      upcomingList 
    };
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
        {/* Chart 1: Status Distribution */}
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

        {/* Chart 2: Top Destinations */}
        <div className="chart-box">
          <h3>Top Destinations</h3>
          <div style={{ height: 250, marginTop: "20px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.destinationData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} name="Shipments" maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Creation Trend */}
        <div className="chart-box">
          <h3>Shipment Creation Trend</h3>
          <div style={{ height: 250, marginTop: "20px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.creationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} name="New Shipments" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Expected Deliveries */}
        <div className="chart-box" style={{ overflowY: 'auto' }}>
          <h3>Upcoming Deliveries</h3>
          <div className="upcoming-list" style={{ marginTop: '16px' }}>
            {metrics.upcomingList.length > 0 ? metrics.upcomingList.map(s => (
              <div key={s.id} className="upcoming-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.95rem' }}>{s.referenceNumber}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.origin} &rarr; {s.destination}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#f59e0b', display: 'block', fontSize: '0.95rem' }}>
                    {new Date(s.expectedDeliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.currentStatus.replace(/_/g, ' ')}</span>
                </div>
              </div>
            )) : (
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '20px' }}>No upcoming deliveries.</p>
            )}

            {onViewAll && (
              <button 
                onClick={onViewAll} 
                style={{ width: '100%', marginTop: '16px', padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                View all upcoming deliveries
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
