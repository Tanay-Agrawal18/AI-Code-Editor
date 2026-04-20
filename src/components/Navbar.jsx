import {
  Sparkles,
  Zap,
  GitBranch,
  ChevronDown,
  Code2,
  Loader2,
  CircleDot,
} from "lucide-react";

const INTENTS = [
  { value: "optimize", label: "Optimize", icon: "⚡" },
  { value: "debug", label: "Debug", icon: "🛠" },
  { value: "clean", label: "Clean", icon: "✨" },
];

export default function Navbar({
  intent,
  setIntent,
  onExplain,
  onApplyAI,
  onVisualize,
  isLoading,
  explainLoading,
  intentLoading,
  vizLoading,
  fileName = "main.js",
}) {
  return (
    <nav
      id="main-navbar"
      className="flex items-center justify-between shrink-0"
      style={{
        padding: "0 20px",
        height: "52px",
        background: "linear-gradient(180deg, rgba(17,24,39,0.95) 0%, rgba(10,14,26,0.98) 100%)",
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        animation: "fadeInDown 0.3s ease-out",
        zIndex: 100,
      }}
    >
      {/* ── Left: Logo + Title ── */}
      <div className="flex items-center" style={{ gap: "10px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px var(--accent-glow)",
          }}
        >
          <Code2 size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <h1
          style={{
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          AI Code Editor
        </h1>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            padding: "2px 6px",
            borderRadius: "var(--radius-sm)",
            background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
            color: "var(--accent-primary-light)",
            border: "1px solid rgba(99,102,241,0.2)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Pro
        </span>
      </div>

      {/* ── Center: File Name ── */}
      <div className="file-indicator-center flex items-center" style={{ gap: "8px" }}>
        <CircleDot
          size={8}
          style={{ color: "#f59e0b" }}
        />
        <span
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--text-secondary)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {fileName}
        </span>
        <span
          style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            fontStyle: "italic",
          }}
        >
          — unsaved
        </span>
      </div>

      {/* ── Right: Actions ── */}
      <div
        className="navbar-actions flex items-center"
        style={{ gap: "8px" }}
      >
        {/* Intent Group */}
        <div
          className="intent-group flex items-center"
          style={{
            gap: "6px",
            padding: "4px 8px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div style={{ position: "relative" }}>
            <select
              id="intent-select"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              style={{
                appearance: "none",
                padding: "5px 28px 5px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
                cursor: "pointer",
                outline: "none",
                transition: "border-color var(--duration-fast)",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent-primary)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border-default)"}
            >
              {INTENTS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.icon} {i.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
          </div>

          <button
            id="apply-ai-btn"
            onClick={onApplyAI}
            disabled={isLoading}
            className="btn-base"
            style={{
              padding: "5px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontFamily: "'Inter', sans-serif",
              background: isLoading
                ? "var(--bg-elevated)"
                : "linear-gradient(135deg, var(--success), var(--success-light))",
              color: isLoading ? "var(--text-muted)" : "#fff",
              boxShadow: isLoading ? "none" : "0 2px 10px var(--success-glow)",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {intentLoading ? (
              <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Zap size={12} />
            )}
            <span>{intentLoading ? "Applying..." : "Apply AI"}</span>
          </button>
        </div>

        {/* Divider */}
        <div
          className="hide-mobile"
          style={{
            width: "1px",
            height: "24px",
            background: "var(--border-default)",
          }}
        />

        {/* Explain Button */}
        <button
          id="explain-code-btn"
          onClick={onExplain}
          disabled={isLoading}
          className="btn-base"
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-md)",
            fontSize: "12px",
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            background: isLoading
              ? "var(--bg-elevated)"
              : "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            color: isLoading ? "var(--text-muted)" : "#fff",
            boxShadow: isLoading ? "none" : "0 2px 12px var(--accent-glow)",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {explainLoading ? (
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Sparkles size={13} />
          )}
          <span className="hide-mobile">{explainLoading ? "Thinking..." : "Explain"}</span>
        </button>

        {/* Visualize Button */}
        <button
          id="visualize-code-btn"
          onClick={onVisualize}
          disabled={isLoading}
          className="btn-base"
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-md)",
            fontSize: "12px",
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            background: isLoading
              ? "var(--bg-elevated)"
              : "linear-gradient(135deg, var(--accent-secondary), #a78bfa)",
            color: isLoading ? "var(--text-muted)" : "#fff",
            boxShadow: isLoading
              ? "none"
              : "0 2px 12px rgba(139,92,246,0.25)",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {vizLoading ? (
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <GitBranch size={13} />
          )}
          <span className="hide-mobile">{vizLoading ? "Analyzing..." : "Visualize"}</span>
        </button>

        {/* Status Indicator */}
        <div
          className="hide-mobile flex items-center"
          style={{
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: isLoading ? "var(--warning)" : "#4ade80",
              boxShadow: isLoading
                ? "0 0 8px rgba(245,158,11,0.4)"
                : "0 0 8px rgba(74,222,128,0.4)",
              animation: "breathe 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--text-muted)",
            }}
          >
            {isLoading ? "Processing" : "Ready"}
          </span>
        </div>
      </div>
    </nav>
  );
}
