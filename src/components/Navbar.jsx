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
    <nav id="main-navbar" className="navbar">
      {/* ── Left: Dashboard → Logo + Project Name ── */}
      <div className="navbar-left">
        {onBackToDashboard && (
          <button
            id="back-to-dashboard-btn"
            onClick={onBackToDashboard}
            title="Back to Dashboard"
            className="navbar-dashboard-btn"
          >
            <LayoutDashboard size={14} />
          </button>
        )}

        <div className="navbar-logo-icon">
          <Code2 size={15} color="#fff" strokeWidth={2.5} />
        </div>

        {projectName && (
          <>
            <span className="navbar-project" title={projectName}>
              {projectName}
            </span>
            <span className="navbar-breadcrumb" style={{ margin: "0 2px" }}>/</span>
          </>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="navbar-file-name">{fileName}</span>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#f59e0b",
              boxShadow: "0 0 6px rgba(245,158,11,0.5)",
            }}
            title="Unsaved changes"
          />
        </div>

        <span className="navbar-badge" style={{ marginLeft: 4 }}>Pro</span>
      </div>

      {/* ── Right: Actions ── */}
      <div className="navbar-actions">
        {/* ─── AI Actions Group: Optimize Select + Apply AI + Generate ─── */}
        <div className="navbar-group">
          <div style={{ position: "relative", width: "32px", height: "32px" }} title="Optimize">
            <select
              id="intent-select"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              className="navbar-intent-select-icon"
            >
              {INTENTS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
              }}
            >
              {INTENTS.find((i) => i.value === intent)?.icon || "⚡"}
            </div>
          </div>

          <button
            id="apply-ai-btn"
            onClick={onApplyAI}
            disabled={isLoading}
            className={`navbar-btn navbar-btn-primary`}
          >
            {intentLoading ? (
              <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Zap size={12} />
            )}
            <span>{intentLoading ? "Applying..." : "Apply AI"}</span>
          </button>

          <button
            id="generate-project-btn"
            onClick={onOpenGenerator}
            disabled={isLoading}
            className="navbar-btn"
          >
            <Wand2 size={13} style={{ color: "#f59e0b" }} />
            <span className="hide-mobile">Generate</span>
          </button>
        </div>

        <div className="navbar-divider hide-mobile" />

        {/* ─── Utility Group: Format + Explain + Visualize ─── */}
        <div className="navbar-group">
          <button
            id="format-code-btn"
            onClick={onFormat}
            disabled={isLoading}
            className="navbar-btn navbar-btn-muted"
          >
            <AlignLeft size={13} style={{ color: "#94a3b8" }} />
            <span className="hide-mobile">Format</span>
          </button>

          <button
            id="explain-code-btn"
            onClick={onExplain}
            disabled={isLoading}
            className="navbar-btn navbar-btn-muted"
          >
            {explainLoading ? (
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Sparkles size={13} style={{ color: "#a855f7" }} />
            )}
            <span className="hide-mobile">{explainLoading ? "Thinking..." : "Explain"}</span>
          </button>

          <button
            id="visualize-code-btn"
            onClick={onVisualize}
            disabled={isLoading}
            className="navbar-btn navbar-btn-muted"
          >
            {vizLoading ? (
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <GitBranch size={13} style={{ color: "#3b82f6" }} />
            )}
            <span className="hide-mobile">{vizLoading ? "Analyzing..." : "Visualize"}</span>
          </button>
        </div>

        <div className="navbar-divider hide-mobile" />

        {/* ─── System Group: GitHub + Export + AI Chat ─── */}
        <div className="navbar-group">
          <button
            id="github-import-btn"
            onClick={onOpenGitHubImport}
            disabled={isLoading}
            className="navbar-btn navbar-btn-muted"
          >
            <GitFork size={13} style={{ color: "#cbd5e1" }} />
            <span className="hide-mobile">GitHub</span>
          </button>

          <button
            id="export-project-btn"
            onClick={onExportProject}
            disabled={isLoading}
            className="navbar-btn navbar-btn-muted"
          >
            <Download size={13} style={{ color: "#06b6d4" }} />
            <span className="hide-mobile">Export</span>
          </button>

          <button
            id="ai-chat-toggle-btn"
            onClick={onToggleChat}
            className={`navbar-btn navbar-btn-accent ${showChat ? "navbar-btn-accent-active" : ""}`}
          >
            <MessageSquare size={13} />
            <span className="hide-mobile">{showChat ? "Close Chat" : "AI Chat"}</span>
          </button>
        </div>

        <div className="navbar-divider hide-mobile" />

        {/* ─── Undo / Redo / History ─── */}
        <div className="navbar-undo-group">
          <button
            id="undo-ai-btn"
            onClick={onUndo}
            disabled={undoCount === 0}
            title={`Undo AI Change (Ctrl+Shift+Z) — ${undoCount} in stack`}
            className={`navbar-btn-undo ${undoCount > 0 ? "navbar-btn-undo-active" : ""}`}
          >
            <Undo2 size={13} />
            <span className="hide-mobile">Undo</span>
            {undoCount > 0 && (
              <span className="navbar-undo-badge">{undoCount}</span>
            )}
          </button>

          <button
            id="redo-ai-btn"
            onClick={onRedo}
            disabled={redoCount === 0}
            title={`Redo AI Change (Ctrl+Shift+Y) — ${redoCount} in stack`}
            className={`navbar-btn-undo ${redoCount > 0 ? "navbar-btn-redo-active" : ""}`}
          >
            <Redo2 size={13} />
            <span className="hide-mobile">Redo</span>
          </button>

          <button
            id="history-toggle-btn"
            onClick={onToggleHistory}
            disabled={undoCount === 0}
            title="View Change History"
            className={`navbar-btn-undo ${showHistoryPanel ? "navbar-btn-history-active" : ""}`}
          >
            <History size={13} />
          </button>

          {/* History Dropdown Panel */}
          {showHistoryPanel && undoStack.length > 0 && (
            <div
              className="navbar-history-panel undo-history-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="navbar-history-header">
                <History size={12} style={{ color: "var(--accent-primary-light)" }} />
                <span className="navbar-history-title">Change History</span>
                <span className="navbar-history-count">{undoStack.length} / 10</span>
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
                    className={`navbar-history-entry ${idx === 0 ? "navbar-history-entry-latest" : ""}`}
                  >
                    <span className="navbar-history-entry-num">{entryNum}</span>
                    <span className="navbar-history-entry-label">{entry.label}</span>
                    <span className="navbar-history-entry-time">
                      <Clock size={9} />
                      {ageStr}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Status Indicator ─── */}
        <div className="navbar-status hide-mobile">
          <span className={`navbar-status-dot ${isLoading ? "navbar-status-dot-loading" : ""}`} />
          <span>{isLoading ? "Processing" : "Ready"}</span>
        </div>
      </div>
    </nav>
  );
}
