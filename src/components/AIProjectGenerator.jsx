import { useState, useRef, useEffect } from "react";
import {
  Wand2,
  Loader2,
  X,
  Sparkles,
  FileCode2,
  AlertCircle,
  ChevronRight,
  Rocket,
  RefreshCw,
  FolderPlus,
  CheckCircle2,
} from "lucide-react";
import { formatCode } from "../utils/formatter";

const API_URL = import.meta.env.VITE_API_URL;
const GENERATE_URL = `${API_URL}/api/generate-project`;

const EXAMPLE_PROMPTS = [
  {
    label: "React Todo App",
    prompt:
      "Create a React todo app with components for TodoList, TodoItem, and AddTodo. Include CSS styling with a modern dark theme.",
  },
  {
    label: "Express REST API",
    prompt:
      "Create a Node.js Express REST API with routes for users CRUD operations. Include middleware for error handling and a config file.",
  },
  {
    label: "Landing Page",
    prompt:
      "Create a modern landing page with HTML, CSS, and JavaScript. Include a hero section, features grid, testimonials, and a contact form.",
  },
  {
    label: "Python Flask App",
    prompt:
      "Create a Python Flask web application with routes for home, about, and contact pages. Include templates and a CSS stylesheet.",
  },
];

const MODES = [
  {
    value: "replace",
    label: "Replace Project",
    icon: RefreshCw,
    desc: "Clear workspace & create fresh project",
    color: "#f59e0b",
  },
  {
    value: "add",
    label: "Add to Existing",
    icon: FolderPlus,
    desc: "Merge generated files into current workspace",
    color: "#6366f1",
  },
];

export default function AIProjectGenerator({ onGenerate, onClose, onToast }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("replace"); // 'replace' | 'add'
  const [phase, setPhase] = useState("input"); // 'input' | 'generating' | 'error'
  const [progress, setProgress] = useState(0);
  const textareaRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // ── Auto-resize textarea ──
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
    }
  }, [prompt]);

  // ── Animated progress bar while generating ──
  useEffect(() => {
    if (phase === "generating") {
      setProgress(0);
      const start = Date.now();
      progressRef.current = setInterval(() => {
        const elapsed = (Date.now() - start) / 1000;
        // Simulate progress: fast at start, slows down, never reaches 100
        const pct = Math.min(95, 100 * (1 - Math.exp(-elapsed / 12)));
        setProgress(pct);
      }, 200);
    } else {
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [phase]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please describe the project you want to generate.");
      return;
    }

    setLoading(true);
    setError("");
    setPhase("generating");

    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate project.");
      }

      if (!data.files || data.files.length === 0) {
        throw new Error("No files were generated. Try a more detailed prompt.");
      }

      // Validate paths — ensure no path traversal
      const safeFiles = data.files.filter((f) => {
        const path = f.path;
        if (path.includes("..") || path.startsWith("/")) return false;
        if (/[<>:"|?*]/.test(path)) return false;
        return true;
      });

      if (safeFiles.length === 0) {
        throw new Error("All generated file paths were invalid.");
      }

      // Format files using Prettier
      const formattedFiles = await Promise.all(
        safeFiles.map(async (f) => ({
          ...f,
          content: await formatCode(f.content, f.path),
        }))
      );

      const projectName = data.projectName || "generated-project";

      // ── Auto-create project immediately ──
      setProgress(100);

      // Small delay for visual satisfaction (progress bar fills to 100%)
      await new Promise((r) => setTimeout(r, 400));

      onGenerate(formattedFiles, projectName, mode);
      onToast(
        `Project '${projectName}' created — ${safeFiles.length} files`,
        "ai"
      );
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setPhase("error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="ai-generator-overlay" onClick={onClose}>
      <div
        className="ai-generator-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="ai-generator-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="ai-generator-icon">
              <Wand2 size={18} />
            </div>
            <div>
              <h2 className="ai-generator-title">AI Project Generator</h2>
              <p className="ai-generator-subtitle">
                Describe → Generate → Auto-scaffold. No manual steps.
              </p>
            </div>
          </div>
          <button className="ai-generator-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* ── Input Phase ── */}
        {(phase === "input" || phase === "error") && (
          <div className="ai-generator-body">
            {/* Mode Selector */}
            <div className="ai-generator-modes">
              {MODES.map((m) => {
                const Icon = m.icon;
                const isActive = mode === m.value;
                return (
                  <button
                    key={m.value}
                    className={`ai-generator-mode-btn ${isActive ? "active" : ""}`}
                    onClick={() => setMode(m.value)}
                    style={{
                      "--mode-color": m.color,
                    }}
                  >
                    <Icon size={14} />
                    <div className="ai-generator-mode-text">
                      <span className="ai-generator-mode-label">{m.label}</span>
                      <span className="ai-generator-mode-desc">{m.desc}</span>
                    </div>
                    {isActive && (
                      <CheckCircle2
                        size={14}
                        style={{ color: m.color, flexShrink: 0 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Prompt Input */}
            <div className="ai-generator-input-wrap">
              <label className="ai-generator-label">
                <FileCode2 size={13} />
                Project Description
              </label>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="Describe the project you want to build... &#10;e.g., 'Create a React dashboard with sidebar navigation, a chart component, and user settings page'"
                className="ai-generator-textarea"
                rows={3}
              />
              <div className="ai-generator-hint">
                <span>Press</span>
                <kbd>Ctrl</kbd>
                <span>+</span>
                <kbd>Enter</kbd>
                <span>to generate</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="ai-generator-error">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Example Prompts */}
            <div className="ai-generator-examples">
              <span className="ai-generator-examples-label">
                <Sparkles size={11} />
                Try an example
              </span>
              <div className="ai-generator-chips">
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <button
                    key={i}
                    className="ai-generator-chip"
                    onClick={() => {
                      setPrompt(ex.prompt);
                      setError("");
                    }}
                  >
                    <ChevronRight size={11} />
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              className="ai-generator-btn"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
            >
              <Rocket size={15} />
              <span>
                {mode === "replace"
                  ? "Generate & Replace Project"
                  : "Generate & Add to Project"}
              </span>
            </button>
          </div>
        )}

        {/* ── Generating Phase ── */}
        {phase === "generating" && (
          <div className="ai-generator-body ai-generator-loading">
            <div className="ai-generator-loading-icon">
              <Loader2
                size={36}
                style={{ animation: "spin 1.2s linear infinite" }}
              />
            </div>
            <h3 className="ai-generator-loading-title">
              {mode === "replace"
                ? "Creating your project..."
                : "Generating files..."}
            </h3>
            <p className="ai-generator-loading-subtitle">
              AI is writing code and structuring files. This may take 10-30
              seconds.
            </p>
            <div className="ai-generator-loading-bar">
              <div
                className="ai-generator-loading-bar-fill"
                style={{
                  width: `${progress}%`,
                  transition: "width 0.3s ease-out",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontFamily: "'JetBrains Mono', monospace",
                marginTop: "4px",
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
