import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Zap,
  GitBranch,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileCode2,
  Brain,
  Wand2,
  ArrowLeftRight,
  Maximize2,
} from "lucide-react";

const INTENT_LABELS = {
  optimize: "Optimized",
  debug: "Debugged",
  clean: "Cleaned",
};

const TABS = [
  { id: "explain", label: "Explain", icon: Sparkles },
  { id: "result", label: "Result", icon: Zap },
  { id: "visualize", label: "Visualize", icon: GitBranch },
];

export default function TabPanel({
  activeTab,
  setActiveTab,
  // Explain
  explanation,
  explainLoading,
  explainError,
  // Result
  result,
  intentLoading,
  intentError,
  intent,
  originalCode,
  // Visualize
  vizData,
  vizLoading,
  vizError,
  onOpenFlowView,
  // Panel
  onClose,
  onToast,
}) {
  const [copied, setCopied] = useState(false);
  const [showBefore, setShowBefore] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const panelRef = useRef(null);

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      onToast?.("Copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = result;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      onToast?.("Copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (collapsed) {
    return (
      <div
        style={{
          width: "40px",
          background: "var(--bg-raised)",
          borderLeft: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "12px",
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all var(--duration-fast)",
          }}
          title="Expand panel"
        >
          <ChevronLeft size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="panel-pane flex flex-col min-h-0"
      style={{
        width: "380px",
        minWidth: "320px",
        background: "var(--bg-raised)",
        borderLeft: "1px solid var(--border-subtle)",
        animation: "slideInRight 0.3s var(--ease-smooth)",
      }}
    >
      {/* ── Tab Header ── */}
      <div
        className="flex items-center shrink-0"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(255,255,255,0.01)",
        }}
      >
        {/* Tabs */}
        <div className="flex flex-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${isActive ? "active" : ""}`}
                style={{ flex: 1, justifyContent: "center" }}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Collapse */}
        <button
          onClick={() => setCollapsed(true)}
          style={{
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            transition: "color var(--duration-fast)",
            marginRight: "4px",
          }}
          title="Collapse panel"
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* ── Tab Content ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          padding: "16px",
          scrollBehavior: "smooth",
        }}
      >
        {/* ═══ EXPLAIN TAB ═══ */}
        {activeTab === "explain" && (
          <div className="panel-content-enter">
            {explainLoading && <LoadingState icon={Brain} label="Thinking..." sublabel="Analyzing your code with AI" color="var(--accent-primary)" />}

            {explainError && !explainLoading && <ErrorState message={explainError} />}

            {explanation && !explainLoading && (
              <div
                style={{
                  fontSize: "13px",
                  lineHeight: "1.75",
                  color: "var(--text-secondary)",
                  fontFamily: "'Inter', sans-serif",
                  whiteSpace: "pre-wrap",
                  animation: "fadeInUp var(--duration-normal) var(--ease-smooth)",
                }}
              >
                {explanation}
              </div>
            )}

            {!explainLoading && !explainError && !explanation && (
              <EmptyState
                icon={Sparkles}
                title="No explanation yet"
                description='Click "Explain" to get a step-by-step breakdown of your code.'
              />
            )}
          </div>
        )}

        {/* ═══ RESULT TAB ═══ */}
        {activeTab === "result" && (
          <div className="panel-content-enter">
            {intentLoading && <LoadingState icon={Wand2} label="Applying AI..." sublabel={
              intent === "optimize" ? "Optimizing for performance" :
              intent === "debug" ? "Scanning and fixing bugs" :
              "Improving readability"
            } color="var(--success)" />}

            {intentError && !intentLoading && <ErrorState message={intentError} />}

            {result && !intentLoading && (
              <div style={{ animation: "fadeInUp var(--duration-normal) var(--ease-smooth)" }}>
                {/* Action bar */}
                <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
                  <div className="flex items-center" style={{ gap: "6px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--text-muted)",
                      }}
                    >
                      {showBefore ? "Original" : `${INTENT_LABELS[intent] || "Modified"}`} Code
                    </span>
                  </div>
                  <div className="flex items-center" style={{ gap: "6px" }}>
                    {originalCode && (
                      <button
                        onClick={() => setShowBefore((v) => !v)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: showBefore
                            ? "rgba(99,102,241,0.12)"
                            : "var(--bg-surface)",
                          color: showBefore
                            ? "var(--accent-primary-light)"
                            : "var(--text-secondary)",
                          border: showBefore
                            ? "1px solid rgba(99,102,241,0.25)"
                            : "1px solid var(--border-default)",
                          cursor: "pointer",
                          transition: "all var(--duration-fast)",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <ArrowLeftRight size={10} />
                        {showBefore ? "After" : "Before"}
                      </button>
                    )}
                    <button
                      onClick={handleCopy}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: copied
                          ? "rgba(16,185,129,0.12)"
                          : "var(--bg-surface)",
                        color: copied ? "var(--success-light)" : "var(--text-secondary)",
                        border: copied
                          ? "1px solid rgba(16,185,129,0.25)"
                          : "1px solid var(--border-default)",
                        cursor: "pointer",
                        transition: "all var(--duration-fast)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {copied ? <Check size={10} /> : <Copy size={10} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Code block */}
                <div
                  style={{
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border-default)",
                    background: "var(--bg-deepest)",
                    overflow: "hidden",
                  }}
                >
                  <pre
                    style={{
                      padding: "16px",
                      fontSize: "12px",
                      lineHeight: "1.7",
                      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                      color: "#e6edf3",
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      tabSize: 2,
                      overflowX: "auto",
                    }}
                  >
                    {showBefore ? originalCode : result}
                  </pre>
                </div>
              </div>
            )}

            {!intentLoading && !intentError && !result && (
              <EmptyState
                icon={Zap}
                title="No result yet"
                description='Select an intent and click "Apply AI" to transform your code.'
              />
            )}
          </div>
        )}

        {/* ═══ VISUALIZE TAB ═══ */}
        {activeTab === "visualize" && (
          <div className="panel-content-enter">
            {vizLoading && <LoadingState icon={GitBranch} label="Analyzing..." sublabel="Extracting functions and mapping relationships" color="var(--accent-secondary)" />}

            {vizError && !vizLoading && <ErrorState message={vizError} />}

            {vizData && !vizLoading && (
              <div style={{ animation: "fadeInUp var(--duration-normal) var(--ease-smooth)" }}>
                {/* Graph summary */}
                <div
                  className="glass-panel"
                  style={{
                    padding: "16px",
                    borderRadius: "var(--radius-lg)",
                    marginBottom: "16px",
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: "12px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                      Graph Overview
                    </span>
                  </div>
                  <div className="flex items-center" style={{ gap: "16px" }}>
                    <StatBadge label="Functions" value={vizData.nodes.length} color="var(--accent-primary)" />
                    <StatBadge label="Connections" value={vizData.edges.length} color="var(--success)" />
                  </div>
                </div>

                {/* Function list */}
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "8px", display: "block" }}>
                    Detected Functions
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {vizData.nodes.map((name, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "var(--radius-md)",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12px",
                        }}
                      >
                        <FileCode2 size={12} style={{ color: "var(--accent-primary-light)" }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: "var(--text-primary)" }}>
                          {name}()
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open full view button */}
                <button
                  onClick={onOpenFlowView}
                  className="btn-base"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    background: "linear-gradient(135deg, var(--accent-secondary), #a78bfa)",
                    color: "#fff",
                    boxShadow: "0 4px 16px rgba(139,92,246,0.25)",
                    justifyContent: "center",
                  }}
                >
                  <Maximize2 size={14} />
                  Open Full Graph View
                </button>
              </div>
            )}

            {!vizLoading && !vizError && !vizData && (
              <EmptyState
                icon={GitBranch}
                title="No visualization yet"
                description={"Click \"Visualize\" to see your code's function relationships."}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared Sub-Components ── */

function LoadingState({ icon: Icon, label, sublabel, color }) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ gap: "16px", padding: "48px 0" }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "var(--radius-xl)",
          background: `linear-gradient(135deg, ${color}15, ${color}25)`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "thinkPulse 2s ease-in-out infinite",
        }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div className="flex flex-col items-center" style={{ gap: "4px" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
          {label}
        </span>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {sublabel}
        </span>
      </div>
      <div className="flex" style={{ gap: "6px" }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: color,
              animation: `dotBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: "var(--radius-lg)",
        background: "rgba(239, 68, 68, 0.06)",
        border: "1px solid rgba(239, 68, 68, 0.15)",
        display: "flex",
        alignItems: "start",
        gap: "10px",
        animation: "fadeInUp var(--duration-normal) var(--ease-smooth)",
      }}
    >
      <AlertCircle size={16} style={{ color: "var(--danger-light)", flexShrink: 0, marginTop: "2px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--danger-light)" }}>Error</span>
        <span style={{ fontSize: "12px", lineHeight: "1.5", color: "#fca5a5" }}>{message}</span>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        gap: "12px",
        padding: "60px 24px",
        textAlign: "center",
        animation: "fadeIn var(--duration-slow) var(--ease-smooth)",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "var(--radius-xl)",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid var(--border-default)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={20} style={{ color: "var(--text-secondary)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{title}</span>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.5" }}>{description}</span>
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div className="flex items-center" style={{ gap: "8px" }}>
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "2px",
          background: color,
          boxShadow: `0 0 8px ${color}40`,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
          {value}
        </span>
        <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
          {label}
        </span>
      </div>
    </div>
  );
}
