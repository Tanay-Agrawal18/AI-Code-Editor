import { Terminal, GitBranch, Wifi, Clock } from "lucide-react";
import { useState, useEffect } from "react";

export default function StatusBar({ isLoading, language = "JavaScript" }) {
  const [time, setTime] = useState(getTime());

  useEffect(() => {
    const interval = setInterval(() => setTime(getTime()), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer
      id="status-bar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "24px",
        padding: "0 12px",
        background: isLoading
          ? "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))"
          : "var(--bg-deepest)",
        borderTop: "1px solid var(--border-subtle)",
        fontSize: "11px",
        fontWeight: 500,
        color: isLoading ? "#fff" : "var(--text-secondary)",
        transition: "background 0.4s var(--ease-smooth)",
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <StatusItem icon={GitBranch} label="main" />
        <StatusItem
          icon={Wifi}
          label={isLoading ? "Processing..." : "Connected"}
          glow={isLoading}
        />
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <span>{language}</span>
        <span>UTF-8</span>
        <StatusItem icon={Terminal} label="Groq AI" />
        <StatusItem icon={Clock} label={time} />
      </div>
    </footer>
  );
}

function StatusItem({ icon: Icon, label, glow }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        opacity: glow ? 1 : 0.9,
      }}
    >
      <Icon size={11} />
      <span>{label}</span>
    </div>
  );
}

function getTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
