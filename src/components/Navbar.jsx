import {
  Sparkles,
  Zap,
  GitBranch,
  ChevronDown,
  Code2,
  Loader2,
  CircleDot,
  Wand2,
  AlignLeft,
  GitFork,
  Download,
  LayoutDashboard,
  ChevronRight,
  MessageSquare,
  Undo2,
  Redo2,
  History,
  Clock,
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
  onOpenGenerator,
  onOpenGitHubImport,
  onExportProject,
  onToggleChat,
  showChat,
  onFormat,
  isLoading,
  explainLoading,
  intentLoading,
  vizLoading,
  fileName = "main.js",
  projectName,
  onBackToDashboard,
  onUndo,
  onRedo,
  undoCount = 0,
  redoCount = 0,
  undoStack = [],
  showHistoryPanel,
  onToggleHistory,
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
      {/* ── Left: Dashboard → Logo + Project Name ── */}
      <div className="flex items-center shrink-0" style={{ gap: "10px" }}>
        {/* Dashboard Button */}
        {onBackToDashboard && (
          <button
            id="back-to-dashboard-btn"
            onClick={onBackToDashboard}
            title="Back to Dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.12)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
              e.currentTarget.style.color = "var(--accent-primary-light)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <LayoutDashboard size={14} />
          </button>
        )}

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
        {projectName && (
          <>
            <ChevronRight
              size={12}
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--accent-primary-light)",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "-0.01em",
                maxWidth: "140px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={projectName}
            >
              {projectName}
            </span>
          </>
        )}
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
      <div className="file-indicator-center flex items-center shrink-0" style={{ gap: "8px" }}>
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

        {/* Format Button */}
        <button
          id="format-code-btn"
          onClick={onFormat}
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
              : "rgba(255,255,255,0.03)",
            color: isLoading ? "var(--text-muted)" : "var(--text-primary)",
            border: "1px solid var(--border-default)",
            opacity: isLoading ? 0.7 : 1,
            transition: "all var(--duration-fast)",
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }
          }}
        >
          <AlignLeft size={13} />
          <span className="hide-mobile">Format</span>
        </button>

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

        {/* Generate Button */}
        <button
          id="generate-project-btn"
          onClick={onOpenGenerator}
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
              : "linear-gradient(135deg, #f59e0b, #f97316)",
            color: isLoading ? "var(--text-muted)" : "#fff",
            boxShadow: isLoading
              ? "none"
              : "0 2px 12px rgba(245,158,11,0.25)",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          <Wand2 size={13} />
          <span className="hide-mobile">Generate</span>
        </button>

        {/* GitHub Import Button */}
        <button
          id="github-import-btn"
          onClick={onOpenGitHubImport}
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
              : "linear-gradient(135deg, #333, #0d1117)",
            color: isLoading ? "var(--text-muted)" : "#fff",
            boxShadow: isLoading
              ? "none"
              : "0 2px 12px rgba(0,0,0,0.3)",
            opacity: isLoading ? 0.7 : 1,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <GitFork size={13} />
          <span className="hide-mobile">GitHub</span>
        </button>

        {/* Export / Download Button */}
        <button
          id="export-project-btn"
          onClick={onExportProject}
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
              : "linear-gradient(135deg, #0891b2, #06b6d4)",
            color: isLoading ? "var(--text-muted)" : "#fff",
            boxShadow: isLoading
              ? "none"
              : "0 2px 12px rgba(8,145,178,0.25)",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          <Download size={13} />
          <span className="hide-mobile">Export</span>
        </button>

        {/* AI Chat Toggle Button */}
        <button
          id="ai-chat-toggle-btn"
          onClick={onToggleChat}
          className="btn-base"
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-md)",
            fontSize: "12px",
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            background: showChat
              ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))"
              : "linear-gradient(135deg, #7c3aed, #a78bfa)",
            color: showChat ? "#fff" : "#fff",
            boxShadow: showChat
              ? "0 2px 16px var(--accent-glow-strong)"
              : "0 2px 12px rgba(124,58,237,0.25)",
            opacity: 1,
            border: showChat
              ? "1px solid rgba(99,102,241,0.4)"
              : "none",
          }}
        >
          <MessageSquare size={13} />
          <span className="hide-mobile">{showChat ? "Close Chat" : "AI Chat"}</span>
        </button>

        {/* Divider */}
        <div
          className="hide-mobile"
          style={{
            width: "1px",
            height: "24px",
            background: "var(--border-default)",
          }}
        />

        {/* ── Undo / Redo / History Group ── */}
        <div
          className="undo-redo-group flex items-center"
          style={{
            gap: "4px",
            padding: "3px 6px",
            borderRadius: "var(--radius-md)",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-default)",
            position: "relative",
          }}
        >
          {/* Undo Button */}
          <button
            id="undo-ai-btn"
            onClick={onUndo}
            disabled={undoCount === 0}
            title={`Undo AI Change (Ctrl+Shift+Z) — ${undoCount} in stack`}
            className="btn-base"
            style={{
              padding: "5px 10px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              background: undoCount === 0
                ? "rgba(255,255,255,0.02)"
                : "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.1))",
              color: undoCount === 0
                ? "var(--text-muted)"
                : "#fbbf24",
              border: undoCount === 0
                ? "1px solid transparent"
                : "1px solid rgba(251,191,36,0.25)",
              opacity: undoCount === 0 ? 0.5 : 1,
              cursor: undoCount === 0 ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <Undo2 size={13} />
            <span className="hide-mobile">Undo</span>
            {undoCount > 0 && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  background: "rgba(251,191,36,0.2)",
                  color: "#fbbf24",
                  borderRadius: "6px",
                  padding: "1px 5px",
                  lineHeight: "1.4",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {undoCount}
              </span>
            )}
          </button>

          {/* Redo Button */}
          <button
            id="redo-ai-btn"
            onClick={onRedo}
            disabled={redoCount === 0}
            title={`Redo AI Change (Ctrl+Shift+Y) — ${redoCount} in stack`}
            className="btn-base"
            style={{
              padding: "5px 10px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              background: redoCount === 0
                ? "rgba(255,255,255,0.02)"
                : "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.1))",
              color: redoCount === 0
                ? "var(--text-muted)"
                : "#34d399",
              border: redoCount === 0
                ? "1px solid transparent"
                : "1px solid rgba(52,211,153,0.25)",
              opacity: redoCount === 0 ? 0.5 : 1,
              cursor: redoCount === 0 ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <Redo2 size={13} />
            <span className="hide-mobile">Redo</span>
          </button>

          {/* History Button */}
          <button
            id="history-toggle-btn"
            onClick={onToggleHistory}
            disabled={undoCount === 0}
            title="View Change History"
            className="btn-base"
            style={{
              padding: "5px 8px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              background: showHistoryPanel
                ? "rgba(99,102,241,0.15)"
                : "rgba(255,255,255,0.02)",
              color: showHistoryPanel
                ? "var(--accent-primary-light)"
                : undoCount === 0
                  ? "var(--text-muted)"
                  : "var(--text-secondary)",
              border: showHistoryPanel
                ? "1px solid rgba(99,102,241,0.3)"
                : "1px solid transparent",
              opacity: undoCount === 0 ? 0.5 : 1,
              cursor: undoCount === 0 ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <History size={13} />
          </button>

          {/* History Dropdown Panel */}
          {showHistoryPanel && undoStack.length > 0 && (
            <div
              className="undo-history-dropdown"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                minWidth: "280px",
                maxHeight: "320px",
                overflowY: "auto",
                background: "rgba(15,18,30,0.95)",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius-lg)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
                zIndex: 999,
                animation: "scaleIn 0.15s ease-out",
                padding: "6px 0",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: "8px 14px 6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  borderBottom: "1px solid var(--border-subtle)",
                  marginBottom: "4px",
                }}
              >
                <History size={12} style={{ color: "var(--accent-primary-light)" }} />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Change History
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {undoStack.length} / 10
                </span>
              </div>
              {[...undoStack].reverse().map((entry, idx) => {
                const age = Date.now() - entry.timestamp;
                const ageStr = age < 60000
                  ? `${Math.floor(age / 1000)}s ago`
                  : age < 3600000
                    ? `${Math.floor(age / 60000)}m ago`
                    : `${Math.floor(age / 3600000)}h ago`;
                const entryNum = undoStack.length - idx;
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "7px 14px",
                      fontSize: "12px",
                      color: idx === 0 ? "var(--text-primary)" : "var(--text-secondary)",
                      background: idx === 0 ? "rgba(99,102,241,0.08)" : "transparent",
                      borderLeft: idx === 0 ? "2px solid var(--accent-primary)" : "2px solid transparent",
                      transition: "all 0.12s ease",
                      cursor: "default",
                    }}
                  >
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: idx === 0
                          ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))"
                          : "rgba(255,255,255,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                        fontWeight: 700,
                        color: idx === 0 ? "#fff" : "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {entryNum}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: idx === 0 ? 600 : 400,
                      }}
                    >
                      {entry.label}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        flexShrink: 0,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <Clock size={9} />
                      {ageStr}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
