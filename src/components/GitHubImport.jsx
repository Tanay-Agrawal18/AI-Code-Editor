import { useState, useRef, useEffect, useCallback } from "react";
import {
  GitFork,
  X,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  FileCode,
  FolderGit2,
  ArrowRight,
  Replace,
  FolderPlus,
  Sparkles,
  ExternalLink,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL is not defined");
}
const GITHUB_IMPORT_URL = `${API_URL}/api/github/import`;

const EXAMPLE_REPOS = [
  {
    label: "TodoMVC React",
    url: "tastejs/todomvc",
    icon: "📝",
  },
  {
    label: "React Hooks",
    url: "rehooks/awesome-react-hooks",
    icon: "⚛️",
  },
  {
    label: "30 Seconds of Code",
    url: "Chalarangelo/30-seconds-of-code",
    icon: "⚡",
  },
];

export default function GitHubImport({ onImport, onClose, onToast }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [phase, setPhase] = useState("input"); // input | loading | success | error
  const [error, setError] = useState("");
  const [importData, setImportData] = useState(null);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState("replace"); // replace | merge
  const inputRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    if (phase === "input" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  // Animate progress bar during loading
  useEffect(() => {
    if (phase === "loading") {
      setProgress(0);
      const steps = [
        { target: 15, delay: 200 },
        { target: 35, delay: 800 },
        { target: 55, delay: 1800 },
        { target: 70, delay: 3500 },
        { target: 82, delay: 6000 },
        { target: 90, delay: 10000 },
      ];

      const timers = steps.map(({ target, delay }) =>
        setTimeout(() => setProgress(target), delay)
      );

      return () => timers.forEach(clearTimeout);
    }
  }, [phase]);

  const handleImport = useCallback(async () => {
    const url = repoUrl.trim();
    if (!url) return;

    setPhase("loading");
    setError("");
    setImportData(null);

    try {
      const res = await fetch(GITHUB_IMPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: url }),
      });

      const response = await res.json();

      if (!response.success) {
        setError(response.error || "Failed to import repository.");
        setPhase("error");
        return;
      }

      setProgress(100);
      setImportData(response.data);

      // Small delay to let progress bar fill visually
      setTimeout(() => setPhase("success"), 400);
    } catch (err) {
      setError(
        "Cannot reach the backend server. Make sure it is running on port 5000."
      );
      setPhase("error");
    }
  }, [repoUrl]);

  const handleConfirm = useCallback(() => {
    if (!importData) return;

    // Convert flat files map to the format Home.jsx expects
    const repoName = importData.repo || "imported-project";
    const flatFiles = {};

    Object.entries(importData.files).forEach(([path, content]) => {
      flatFiles[`${repoName}/${path}`] = content;
    });

    onImport(flatFiles, repoName, mode);
    onToast?.(
      `Imported ${importData.fileCount} files from ${importData.owner}/${importData.repo}`,
      "ai"
    );
    onClose();
  }, [importData, mode, onImport, onClose, onToast]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && phase === "input" && repoUrl.trim()) {
      handleImport();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  // File list from import data
  const fileList = importData
    ? Object.keys(importData.files).sort()
    : [];

  return (
    <div className="ai-generator-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ai-generator-modal" style={{ width: "620px" }}>

        {/* ── Header ── */}
        <div className="ai-generator-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "var(--radius-md)",
                background: "linear-gradient(135deg, #333, #0d1117)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 4px 18px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <GitFork size={20} />
            </div>
            <div>
              <div className="ai-generator-title">Import from GitHub</div>
              <div className="ai-generator-subtitle">
                Clone any public repository into your editor
              </div>
            </div>
          </div>
          <button className="ai-generator-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="ai-generator-body">

          {/* INPUT PHASE */}
          {phase === "input" && (
            <>
              {/* URL Input */}
              <div className="ai-generator-input-wrap">
                <label className="ai-generator-label">
                  <FolderGit2 size={13} />
                  Repository URL
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "stretch",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "0 14px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "var(--radius-md)",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent-primary)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-default)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <GitFork size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    <input
                      ref={inputRef}
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="https://github.com/owner/repo or owner/repo"
                      style={{
                        flex: 1,
                        padding: "12px 0",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "var(--text-primary)",
                        fontSize: "13px",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    />
                  </div>
                  <button
                    className="ai-generator-btn"
                    onClick={handleImport}
                    disabled={!repoUrl.trim()}
                    style={{
                      width: "auto",
                      padding: "0 20px",
                      whiteSpace: "nowrap",
                      background: !repoUrl.trim()
                        ? "var(--bg-elevated)"
                        : "linear-gradient(135deg, #333, #0d1117)",
                      boxShadow: !repoUrl.trim()
                        ? "none"
                        : "0 4px 16px rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Download size={14} />
                    Import
                  </button>
                </div>
                <div className="ai-generator-hint">
                  <span>Supports public repos • Press</span>
                  <kbd>Enter</kbd>
                  <span>to import</span>
                </div>
              </div>

              {/* Format Examples */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Accepted formats
                </span>
                {[
                  "https://github.com/owner/repo",
                  "github.com/owner/repo",
                  "owner/repo",
                  "https://github.com/owner/repo/tree/branch",
                ].map((fmt) => (
                  <div
                    key={fmt}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "11.5px",
                      color: "var(--text-secondary)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <ArrowRight size={10} style={{ color: "var(--accent-primary-light)", flexShrink: 0 }} />
                    {fmt}
                  </div>
                ))}
              </div>

              {/* Quick Examples */}
              <div className="ai-generator-examples">
                <span className="ai-generator-examples-label">
                  <Sparkles size={11} />
                  Try an example
                </span>
                <div className="ai-generator-chips">
                  {EXAMPLE_REPOS.map((ex) => (
                    <button
                      key={ex.url}
                      className="ai-generator-chip"
                      onClick={() => setRepoUrl(ex.url)}
                    >
                      <span>{ex.icon}</span>
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* LOADING PHASE */}
          {phase === "loading" && (
            <div
              className="ai-generator-loading"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "48px 24px",
              }}
            >
              <div className="ai-generator-loading-icon">
                <Loader2
                  size={36}
                  style={{ animation: "spin 1.2s linear infinite" }}
                />
              </div>
              <div className="ai-generator-loading-title">
                Fetching Repository…
              </div>
              <div className="ai-generator-loading-subtitle">
                Downloading source files from GitHub. This may take a moment for larger repos.
              </div>
              <div className="ai-generator-loading-bar" style={{ marginTop: "24px" }}>
                <div
                  className="ai-generator-loading-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {progress < 30
                  ? "Fetching file tree…"
                  : progress < 70
                  ? "Downloading file contents…"
                  : progress < 95
                  ? "Almost done…"
                  : "Finalizing…"}
              </div>
            </div>
          )}

          {/* ERROR PHASE */}
          {phase === "error" && (
            <>
              <div className="ai-generator-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
              <div className="ai-generator-actions">
                <button
                  className="ai-generator-btn-secondary"
                  onClick={() => setPhase("input")}
                  style={{ flex: 1 }}
                >
                  Try Again
                </button>
              </div>
            </>
          )}

          {/* SUCCESS PHASE */}
          {phase === "success" && importData && (
            <>
              {/* Success Banner */}
              <div className="ai-generator-success-banner">
                <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>
                    {importData.owner}/{importData.repo}
                  </strong>
                  <span>
                    {importData.fileCount} files • branch: {importData.branch}
                  </span>
                </div>
                <a
                  href={`https://github.com/${importData.owner}/${importData.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--accent-primary-light)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                >
                  <ExternalLink size={12} />
                  Open
                </a>
              </div>

              {/* Mode Selector */}
              <div className="ai-generator-modes">
                <button
                  className={`ai-generator-mode-btn ${mode === "replace" ? "active" : ""}`}
                  onClick={() => setMode("replace")}
                >
                  <Replace
                    size={18}
                    style={{
                      color:
                        mode === "replace"
                          ? "var(--accent-primary-light)"
                          : "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  />
                  <div className="ai-generator-mode-text">
                    <span className="ai-generator-mode-label">Replace Project</span>
                    <span className="ai-generator-mode-desc">
                      Clear current files, start fresh
                    </span>
                  </div>
                </button>
                <button
                  className={`ai-generator-mode-btn ${mode === "merge" ? "active" : ""}`}
                  onClick={() => setMode("merge")}
                >
                  <FolderPlus
                    size={18}
                    style={{
                      color:
                        mode === "merge"
                          ? "var(--accent-primary-light)"
                          : "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  />
                  <div className="ai-generator-mode-text">
                    <span className="ai-generator-mode-label">Add to Project</span>
                    <span className="ai-generator-mode-desc">
                      Merge into existing files
                    </span>
                  </div>
                </button>
              </div>

              {/* File List */}
              <div className="ai-generator-file-list" style={{ maxHeight: "200px" }}>
                {fileList.map((filePath) => (
                  <div key={filePath} className="ai-generator-file-item">
                    <FileCode
                      size={13}
                      style={{ color: "var(--accent-primary-light)", flexShrink: 0 }}
                    />
                    <span className="ai-generator-file-path">{filePath}</span>
                    <span className="ai-generator-file-size">
                      {(importData.files[filePath]?.length || 0) > 1024
                        ? `${(importData.files[filePath].length / 1024).toFixed(1)}KB`
                        : `${importData.files[filePath]?.length || 0}B`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="ai-generator-actions">
                <button
                  className="ai-generator-btn-secondary"
                  onClick={() => {
                    setPhase("input");
                    setImportData(null);
                  }}
                >
                  ← Back
                </button>
                <button className="ai-generator-btn" onClick={handleConfirm}>
                  <Download size={15} />
                  {mode === "replace"
                    ? "Replace & Load Project"
                    : "Add to Project"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
