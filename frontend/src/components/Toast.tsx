import { useEffect, useState } from "react";

export type ToastType = "success" | "error";

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface Props {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

export function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: number) => void }) {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setHiding(true);
    }, 4000); // Start hiding after 4 seconds

    const removeTimer = setTimeout(() => {
      onRemove(toast.id);
    }, 4300); // Remove from DOM after animation completes

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, onRemove]);

  return (
    <div className={`toast ${toast.type} ${hiding ? "toast-hiding" : ""}`}>
      <div className="toast-icon">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="15" />
          <line x1="12" y1="19" x2="12.01" y2="19" />
        </svg>
      </div>
      <span>{toast.message}</span>
    </div>
  );
}
