import { Shipment, ShipmentStatus } from "../types";
import { StatusBadge } from "./StatusBadge";

interface TrackingTimelineProps {
  shipment: Shipment;
}

export function TrackingTimeline({ shipment }: TrackingTimelineProps) {
  const STANDARD_STAGES: ShipmentStatus[] = ["BOOKED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];
  const history = shipment.statusHistory || [];
  let maxStandardIndex = -1;
  
  type TimelineNode = {
    id: string | number;
    status: ShipmentStatus;
    state: "completed" | "current" | "pending";
    changedAt?: string;
    note?: string;
  };
  
  const nodes: TimelineNode[] = [];
  
  history.forEach((h, index) => {
    const isCurrent = index === history.length - 1;
    nodes.push({
      id: h.id,
      status: h.status as ShipmentStatus,
      state: isCurrent ? "current" : "completed",
      changedAt: h.changedAt,
      note: h.note || undefined,
    });
    
    const stdIndex = STANDARD_STAGES.indexOf(h.status as ShipmentStatus);
    if (stdIndex > maxStandardIndex) {
      maxStandardIndex = stdIndex;
    }
  });
  
  if (maxStandardIndex < STANDARD_STAGES.length - 1) {
    for (let i = Math.max(0, maxStandardIndex + 1); i < STANDARD_STAGES.length; i++) {
      nodes.push({
        id: `pending-${i}`,
        status: STANDARD_STAGES[i],
        state: "pending",
      });
    }
  }
  
  return (
    <ul className="timeline">
      {nodes.map((node) => (
        <li key={node.id} className={node.state}>
          <div className="timeline-header">
            <StatusBadge status={node.status} />
            {node.changedAt && (
              <span className="timeline-time">
                {new Date(node.changedAt).toLocaleString(undefined, { 
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                })}
              </span>
            )}
          </div>
          {node.note && <div className="timeline-note">{node.note}</div>}
        </li>
      ))}
    </ul>
  );
}
