import { useState } from "react";
import Editor from "@monaco-editor/react";
import { ChevronDown, Minus, Plus, Loader2 } from "lucide-react";

const defaultCode = `// Welcome to AI Code Editor ✨
// Write or paste your code here, then use AI tools to:
//   • Explain — Understand what your code does
//   • Optimize / Debug / Clean — Transform with AI
//   • Visualize — See function relationships

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function main() {
  const fib10 = fibonacci(10);
  const fact5 = factorial(5);
  
  console.log("Fibonacci(10):", fib10);
  console.log("Factorial(5):", fact5);
}

main();`;

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", color: "#f7df1e" },
  { value: "typescript", label: "TypeScript", color: "#3178c6" },
  { value: "python", label: "Python", color: "#3776ab" },
  { value: "html", label: "HTML", color: "#e34f26" },
  { value: "css", label: "CSS", color: "#1572b6" },
  { value: "json", label: "JSON", color: "#292929" },
];

export default function CodeEditor({ editorRef }) {
  const [language, setLanguage] = useState("javascript");
  const [fontSize, setFontSize] = useState(14);

  const handleEditorMount = (editor) => {
    if (editorRef) editorRef.current = editor;
  };

  const selectedLang = LANGUAGES.find((l) => l.value === language);

  return (
    <div className="editor-pane flex flex-col flex-1 min-h-0">
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
        <div className="file-indicator-center flex items-center" style={{ gap: "6px" }}>
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
            main.js
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
          defaultValue={defaultCode}
          theme="vs-dark"
          onMount={handleEditorMount}
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
              <div className="flex flex-col items-center" style={{ gap: "12px" }}>
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
