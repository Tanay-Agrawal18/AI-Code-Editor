import { useEffect, useState } from "react";
import { Check, AlertCircle, Info, Sparkles } from "lucide-react";

const ICONS = {
  success: Check,
  error: AlertCircle,
  info: Info,
  ai: Sparkles,
};

const COLORS = {
  success: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", icon: "var(--success-light)", text: "var(--success-light)" },
  error: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", icon: "var(--danger-light)", text: "var(--danger-light)" },
  info: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)", icon: "var(--accent-primary-light)", text: "var(--accent-primary-light)" },
  ai: { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)", icon: "#a78bfa", text: "#a78bfa" },
};

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "64px",
        right: "16px",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const type = toast.type || "info";
  const colors = COLORS[type] || COLORS.info;
  const Icon = ICONS[type] || Info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onRemove, 300);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [onRemove, toast.duration]);

  return (
    <div
      className={exiting ? "toast-exit" : "toast-enter"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 16px",
        borderRadius: "var(--radius-md)",
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "var(--shadow-lg)",
        pointerEvents: "auto",
        minWidth: "220px",
        maxWidth: "360px",
      }}
    >
      <Icon size={14} style={{ color: colors.icon, flexShrink: 0 }} />
      <span
        style={{
          fontSize: "12px",
          fontWeight: 500,
          color: colors.text,
          lineHeight: 1.4,
        }}
      >
        {toast.message}
      </span>
    </div>
  );
}
