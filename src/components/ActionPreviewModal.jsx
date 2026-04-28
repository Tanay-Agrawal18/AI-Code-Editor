import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { DiffEditor } from "@monaco-editor/react";
import {
  FilePlus,
  FileCode,
  FileX,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Eye,
  Shield,
  GitCompareArrows,
  Code2,
} from "lucide-react";

// ── Language detection from file extension ──
const EXT_LANG_MAP = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  css: "css",
  html: "html",
  json: "json",
  md: "markdown",
  py: "python",
  rb: "ruby",
  java: "java",
  go: "go",
  rs: "rust",
  cpp: "cpp",
  c: "c",
  sh: "shell",
  yml: "yaml",
  yaml: "yaml",
  xml: "xml",
  sql: "sql",
  scss: "scss",
  less: "less",
  svg: "xml",
  txt: "plaintext",
};

function detectLanguage(filePath) {
  if (!filePath) return "plaintext";
  const ext = filePath.split(".").pop()?.toLowerCase();
  return EXT_LANG_MAP[ext] || "plaintext";
}

// ── Action type configuration ──
const ACTION_CONFIG = {
  create: {
    icon: FilePlus,
    label: "Create",
    bg: "rgba(16,185,129,0.10)",
    border: "rgba(16,185,129,0.25)",
    color: "#34d399",
    dotColor: "#10b981",
    description: "New file will be created",
  },
  update: {
    icon: FileCode,
    label: "Update",
    bg: "rgba(250,204,21,0.08)",
    border: "rgba(250,204,21,0.22)",
    color: "#facc15",
    dotColor: "#eab308",
    description: "Existing file will be modified",
  },
  delete: {
    icon: FileX,
    label: "Delete",
    bg: "rgba(239,68,68,0.10)",
    border: "rgba(239,68,68,0.25)",
    color: "#f87171",
    dotColor: "#ef4444",
    description: "File will be removed",
  },
};

// ── Diff Viewer for update actions ──
// Uses a ref-based cleanup to prevent the "TextModel got disposed before
// DiffEditorWidget model got reset" error when the component unmounts.
function DiffViewer({ original, modified, language }) {
  const editorRef = useRef(null);

  // @monaco-editor/react handles disposal automatically.
  // We only need to clear our local ref on unmount to prevent memory leaks.
  useEffect(() => {
    return () => {
      editorRef.current = null;
    };
  }, []);

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  return (
    <div
      style={{
        borderRadius: "6px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Diff header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          background: "rgba(250,204,21,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <GitCompareArrows size={12} style={{ color: "#facc15", opacity: 0.8 }} />
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--text-muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Original
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: "10px", opacity: 0.4 }}>→</span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "#facc15",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Modified
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "9px",
            color: "var(--text-muted)",
            opacity: 0.5,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {language}
        </span>
      </div>

      {/* Monaco Diff Editor */}
      <DiffEditor
        height="300px"
        original={original}
        modified={modified}
        language={language}
        theme="vs-dark"
        onMount={handleEditorMount}
        options={{
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 12,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineNumbers: "on",
          wordWrap: "on",
          renderOverviewRuler: false,
          overviewRulerBorder: false,
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
          padding: { top: 8, bottom: 8 },
          contextmenu: false,
          renderLineHighlight: "none",
          selectionHighlight: false,
          occurrencesHighlight: "off",
        }}
      />
    </div>
  );
}

// ── Single action row ──
function ActionRow({ action, index, existingFiles }) {
  const [expanded, setExpanded] = useState(false);
  const config = ACTION_CONFIG[action.type] || ACTION_CONFIG.update;
  const Icon = config.icon;

  // Extract file name from path
  const parts = action.path.split("/");
  const fileName = parts[parts.length - 1];
  const folderPath = parts.slice(0, -1).join("/");

  const hasContent =
    action.content && action.type !== "delete" && action.content.length > 0;

  const isUpdate = action.type === "update";

  // Memoize language detection
  const language = useMemo(() => detectLanguage(action.path), [action.path]);

  // Get original content for diff (only for updates)
  const originalContent = useMemo(() => {
    if (!isUpdate || !existingFiles) return "";
    return existingFiles[action.path] || "";
  }, [isUpdate, existingFiles, action.path]);

  const hasDiff = isUpdate && hasContent;

  return (
    <div
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: "10px",
        overflow: "hidden",
        animation: `fadeInUp 0.3s ease-out ${index * 0.06}s both`,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = config.color;
        e.currentTarget.style.transform = "translateX(2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = config.border;
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          cursor: hasContent ? "pointer" : "default",
        }}
        onClick={() => hasContent && setExpanded((v) => !v)}
      >
        {/* Action type badge */}
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `${config.color}18`,
            border: `1px solid ${config.color}30`,
            flexShrink: 0,
          }}
        >
          <Icon size={14} color={config.color} />
        </div>

        {/* File info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "'JetBrains Mono', monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fileName}
            </span>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: config.color,
                background: `${config.color}15`,
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              {config.label}
            </span>
          </div>
          {folderPath && (
            <span
              style={{
                fontSize: "10.5px",
                color: "var(--text-muted)",
                fontFamily: "'JetBrains Mono', monospace",
                opacity: 0.7,
              }}
            >
              {folderPath}/
            </span>
          )}
        </div>

        {/* Expand toggle */}
        {hasContent && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              color: expanded ? config.color : "var(--text-muted)",
              fontSize: "10px",
              padding: "3px 8px",
              borderRadius: "5px",
              background: expanded ? `${config.color}12` : "transparent",
              border: expanded
                ? `1px solid ${config.color}25`
                : "1px solid transparent",
              transition: "all 0.2s ease",
            }}
          >
            {hasDiff ? (
              <GitCompareArrows size={11} style={{ opacity: 0.8 }} />
            ) : (
              <Eye size={11} style={{ opacity: 0.6 }} />
            )}
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              {hasDiff ? "View Changes" : "Preview"}
            </span>
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </div>
        )}
      </div>

      {/* Expanded content — Diff view for updates, plain text for create */}
      {expanded && hasContent && (
        <div
          style={{
            borderTop: `1px solid ${config.border}`,
            padding: hasDiff ? "10px" : "10px 14px",
            background: "rgba(0,0,0,0.2)",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {hasDiff ? (
            /* ── Monaco Diff Editor for update actions ── */
            <DiffViewer
              original={originalContent}
              modified={action.content}
              language={language}
            />
          ) : (
            /* ── Plain text preview for create actions ── */
            <div
              style={{
                borderRadius: "6px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Code preview header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 10px",
                  background: "rgba(16,185,129,0.05)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Code2 size={11} style={{ color: "#34d399", opacity: 0.7 }} />
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  New File Content
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "9px",
                    color: "var(--text-muted)",
                    opacity: 0.5,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {language}
                </span>
              </div>

              {/* Code content */}
              <pre
                style={{
                  margin: 0,
                  padding: "10px 14px",
                  fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  maxHeight: "200px",
                  overflowY: "auto",
                  background: "rgba(0,0,0,0.15)",
                }}
              >
                {action.content.length > 1200
                  ? action.content.slice(0, 1200) + "\n…(truncated)"
                  : action.content}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// MAIN MODAL COMPONENT
// ══════════════════════════════════════════════════
export default function ActionPreviewModal({
  actions,
  onApply,
  onCancel,
  existingFiles,
}) {
  if (!actions || actions.length === 0) return null;

  // Count by type
  const counts = { create: 0, update: 0, delete: 0 };
  actions.forEach((a) => {
    if (counts.hasOwnProperty(a.type)) counts[a.type]++;
  });

  // Make modal wider when there are update actions (need space for diff)
  const hasUpdates = counts.update > 0;

  return (
    <div
      id="action-preview-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={(e) => {
        if (e.target.id === "action-preview-overlay") onCancel();
      }}
    >
      <div
        style={{
          width: hasUpdates ? "min(880px, 94vw)" : "min(520px, 92vw)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "16px",
          background:
            "linear-gradient(165deg, rgba(20,22,35,0.97), rgba(12,14,24,0.98))",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
          animation: "modalSlideIn 0.3s cubic-bezier(0.16,1,0.3,1)",
          overflow: "hidden",
          transition: "width 0.3s ease",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))",
                  border: "1px solid rgba(99,102,241,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.15)",
                }}
              >
                <Shield size={18} style={{ color: "#a78bfa" }} />
              </div>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Review AI Changes
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  {actions.length} action{actions.length !== 1 ? "s" : ""}{" "}
                  pending — review before applying
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onCancel}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.12)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
                e.currentTarget.style.color = "#f87171";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Summary badges */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "14px",
              flexWrap: "wrap",
            }}
          >
            {counts.create > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(16,185,129,0.10)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#34d399",
                }}
              >
                <FilePlus size={11} />
                {counts.create} file{counts.create !== 1 ? "s" : ""} to create
              </div>
            )}
            {counts.update > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(250,204,21,0.08)",
                  border: "1px solid rgba(250,204,21,0.18)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#facc15",
                }}
              >
                <GitCompareArrows size={11} />
                {counts.update} file{counts.update !== 1 ? "s" : ""} to update
                — click to diff
              </div>
            )}
            {counts.delete > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(239,68,68,0.10)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#f87171",
                }}
              >
                <FileX size={11} />
                {counts.delete} file{counts.delete !== 1 ? "s" : ""} to delete
              </div>
            )}
          </div>
        </div>

        {/* ── Action List ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Delete warning */}
          {counts.delete > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
                marginBottom: "4px",
                animation: "fadeIn 0.3s ease-out",
              }}
            >
              <AlertTriangle
                size={13}
                style={{ color: "#f87171", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: "11px",
                  color: "#fca5a5",
                  lineHeight: 1.4,
                }}
              >
                This action includes file deletions. Deleted files cannot be
                recovered.
              </span>
            </div>
          )}

          {actions.map((action, i) => (
            <ActionRow
              key={i}
              action={action}
              index={i}
              existingFiles={existingFiles}
            />
          ))}
        </div>

        {/* ── Footer / Buttons ── */}
        <div
          style={{
            padding: "14px 24px 18px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          {/* Cancel button */}
          <button
            id="action-preview-cancel"
            onClick={onCancel}
            style={{
              padding: "9px 20px",
              borderRadius: "9px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--text-secondary)",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Cancel
          </button>

          {/* Apply button */}
          <button
            id="action-preview-apply"
            onClick={onApply}
            style={{
              padding: "9px 22px",
              borderRadius: "9px",
              border: "none",
              background:
                "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              color: "#fff",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: "0 4px 16px var(--accent-glow)",
              transition: "all 0.2s ease",
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 6px 24px var(--accent-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 16px var(--accent-glow)";
            }}
          >
            <Check size={14} />
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
