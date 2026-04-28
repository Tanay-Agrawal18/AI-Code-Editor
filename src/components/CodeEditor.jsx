import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { ChevronDown, Minus, Plus, Loader2, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const AUTOCOMPLETE_URL = `${API_URL}/api/autocomplete`;
const DEBOUNCE_MS = 400;

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", color: "#f7df1e" },
  { value: "typescript", label: "TypeScript", color: "#3178c6" },
  { value: "python", label: "Python", color: "#3776ab" },
  { value: "html", label: "HTML", color: "#e34f26" },
  { value: "css", label: "CSS", color: "#1572b6" },
  { value: "json", label: "JSON", color: "#292929" },
];

// Map file extensions to Monaco languages
const EXT_TO_LANGUAGE = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  html: "html",
  css: "css",
  json: "json",
  md: "markdown",
  txt: "plaintext",
};

function getLanguageFromFileName(fileName) {
  if (!fileName) return "javascript";
  const ext = fileName.split(".").pop().toLowerCase();
  return EXT_TO_LANGUAGE[ext] || "plaintext";
}

function getFileNameFromPath(path) {
  if (!path) return "untitled";
  const parts = path.split("/");
  return parts[parts.length - 1];
}

export default function CodeEditor({
  editorRef,
  activeFile,
  fileContent,
  onContentChange,
  openTabs = [],
  onSelectTab,
  onCloseTab,
}) {
  const [fontSize, setFontSize] = useState(14);
  const [language, setLanguage] = useState("javascript");
  const monacoEditorRef = useRef(null);
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const providerDisposableRef = useRef(null);
  const isDisposedRef = useRef(false);

  const fileName = getFileNameFromPath(activeFile);

  // Derive language from active file
  useEffect(() => {
    const lang = getLanguageFromFileName(fileName);
    setLanguage(lang);
  }, [fileName]);

  // Cleanup on unmount
  useEffect(() => {
    isDisposedRef.current = false;
    return () => {
      isDisposedRef.current = true;
      if (providerDisposableRef.current) {
        providerDisposableRef.current.dispose();
        providerDisposableRef.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Null out editor refs to prevent stale access
      monacoEditorRef.current = null;
      if (editorRef) editorRef.current = null;
    };
  }, [editorRef]);

  const handleEditorMount = (editor, monaco) => {
    // Dispose previous provider if re-mounting (e.g. HMR)
    if (providerDisposableRef.current) {
      providerDisposableRef.current.dispose();
      providerDisposableRef.current = null;
    }

    isDisposedRef.current = false;
    monacoEditorRef.current = editor;
    if (editorRef) editorRef.current = editor;

    // ── Register AI Inline Completions Provider ──
    providerDisposableRef.current =
      monaco.languages.registerInlineCompletionsProvider("*", {
        provideInlineCompletions: (model, position, _context, token) => {
          return new Promise((resolve) => {
            // Bail out if editor has been disposed
            if (isDisposedRef.current) {
              return resolve({ items: [] });
            }

            // Cancel any pending debounce
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
            }

            // If cancellation already requested, bail out
            if (token.isCancellationRequested) {
              return resolve({ items: [] });
            }

            debounceTimerRef.current = setTimeout(async () => {
              // Bail out if editor has been disposed during debounce
              if (isDisposedRef.current) {
                return resolve({ items: [] });
              }

              // Cancel previous in-flight request
              if (abortControllerRef.current) {
                abortControllerRef.current.abort();
              }

              // Abort if Monaco already cancelled
              if (token.isCancellationRequested) {
                return resolve({ items: [] });
              }

              const controller = new AbortController();
              abortControllerRef.current = controller;

              // Listen for Monaco cancellation
              token.onCancellationRequested(() => {
                controller.abort();
              });

              const codeBeforeCursor = model.getValueInRange({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              });

              // Don't autocomplete for very short input
              if (codeBeforeCursor.trim().length < 8) {
                return resolve({ items: [] });
              }

              try {
                const res = await fetch(AUTOCOMPLETE_URL, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    code: codeBeforeCursor,
                    language:
                      model.getLanguageId?.() ||
                      getLanguageFromFileName(activeFile),
                  }),
                  signal: controller.signal,
                });

                if (!res.ok || token.isCancellationRequested) {
                  return resolve({ items: [] });
                }

                const response = await res.json();

                if (!response.success || !response.data.suggestion || !response.data.suggestion.trim()) {
                  return resolve({ items: [] });
                }

                const data = response.data;

                resolve({
                  items: [
                    {
                      insertText: data.suggestion,
                      range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column,
                      },
                    },
                  ],
                });
              } catch (err) {
                // Silently ignore aborted requests or network errors
                resolve({ items: [] });
              }
            }, DEBOUNCE_MS);
          });
        },

        freeInlineCompletions: () => {
          // No-op cleanup
        },
      });
  };

  const handleEditorChange = (value) => {
    if (onContentChange) {
      onContentChange(value || "");
    }
  };

  const selectedLang = LANGUAGES.find((l) => l.value === language);

  return (
    <div className="editor-pane flex flex-col flex-1 min-h-0">
      {/* ── Open Tabs Bar ── */}
      {openTabs.length > 0 && (
        <div className="editor-tabs-bar">
          {openTabs.map((tabPath) => {
            const tabName = getFileNameFromPath(tabPath);
            const isActive = tabPath === activeFile;
            const lang = getLanguageFromFileName(tabName);
            const langInfo = LANGUAGES.find((l) => l.value === lang);

            return (
              <div
                key={tabPath}
                className={`editor-tab ${isActive ? "editor-tab-active" : ""}`}
                onClick={() => onSelectTab && onSelectTab(tabPath)}
              >
                {/* Language dot */}
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: langInfo?.color || "var(--text-muted)",
                    flexShrink: 0,
                  }}
                />
                <span className="editor-tab-name">{tabName}</span>
                {/* Close button */}
                <button
                  className="editor-tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab && onCloseTab(tabPath);
                  }}
                  title="Close"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Editor Toolbar ── */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          padding: "0 16px",
          height: "38px",
          background: "var(--bg-raised)",
          borderBottom: "1px solid var(--border-subtle)",
          animation: "fadeIn 0.3s ease-out",
        }}
      >
        {/* Left: Language */}
        <div className="flex items-center" style={{ gap: "8px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "2px",
              background: selectedLang?.color || "var(--accent-primary)",
            }}
          />
          <div style={{ position: "relative" }}>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                appearance: "none",
                padding: "3px 24px 3px 8px",
                borderRadius: "var(--radius-sm)",
                fontSize: "11px",
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
                cursor: "pointer",
                outline: "none",
                transition: "border-color var(--duration-fast)",
              }}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={10}
              style={{
                position: "absolute",
                right: "6px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* Center: File info */}
        <div
          className="file-indicator-center flex items-center"
          style={{ gap: "6px" }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#f59e0b",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--text-muted)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {fileName}
          </span>
        </div>

        {/* Right: Font Size */}
        <div className="flex items-center" style={{ gap: "6px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
            }}
          >
            Size
          </span>
          <div className="flex items-center" style={{ gap: "2px" }}>
            <button
              onClick={() => setFontSize((s) => Math.max(12, s - 1))}
              style={{
                width: "22px",
                height: "22px",
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
              aria-label="Decrease font size"
            >
              <Minus size={10} />
            </button>
            <span
              style={{
                width: "28px",
                textAlign: "center",
                fontSize: "11px",
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                color: "var(--text-primary)",
              }}
            >
              {fontSize}
            </span>
            <button
              onClick={() => setFontSize((s) => Math.min(24, s + 1))}
              style={{
                width: "22px",
                height: "22px",
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
              aria-label="Increase font size"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Monaco Editor ── */}
      <div
        className="flex-1 min-h-0"
        style={{ animation: "fadeIn 0.4s ease-out 0.1s both" }}
      >
        <Editor
          height="100%"
          language={language}
          value={fileContent}
          theme="vs-dark"
          onMount={handleEditorMount}
          onChange={handleEditorChange}
          options={{
            fontSize,
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontLigatures: true,
            lineNumbers: "on",
            minimap: { enabled: true, scale: 1, renderCharacters: false },
            wordWrap: "on",
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            bracketPairColorization: { enabled: true },
            renderLineHighlight: "all",
            scrollBeyondLastLine: false,
            tabSize: 2,
            suggest: { showMethods: true, showFunctions: true },
            inlineSuggest: { enabled: true },
            quickSuggestions: true,
            guides: {
              indentation: true,
              bracketPairs: true,
            },
            lineDecorationsWidth: 10,
            overviewRulerBorder: false,
          }}
          loading={
            <div
              className="flex items-center justify-center h-full"
              style={{ background: "var(--bg-base)" }}
            >
              <div
                className="flex flex-col items-center"
                style={{ gap: "12px" }}
              >
                <Loader2
                  size={28}
                  style={{
                    color: "var(--accent-primary)",
                    animation: "spin 1.2s linear infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                  }}
                >
                  Loading editor…
                </span>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
