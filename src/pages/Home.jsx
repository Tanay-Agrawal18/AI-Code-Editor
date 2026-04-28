import { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CodeEditor from "../components/CodeEditor";
import TabPanel from "../components/TabPanel";
import FloatingToolbar from "../components/FloatingToolbar";
const FlowView = lazy(() => import("../components/FlowView"));
import ToastContainer from "../components/ToastContainer";
import StatusBar from "../components/StatusBar";
import FileExplorer from "../components/FileExplorer";
const AIProjectGenerator = lazy(() => import("../components/AIProjectGenerator"));
const GitHubImport = lazy(() => import("../components/GitHubImport"));
import ChatPanel from "../components/ChatPanel";
const ActionPreviewModal = lazy(() => import("../components/ActionPreviewModal"));
import { formatCode } from "../utils/formatter";
import {
  getActiveProjectId,
  getProject,
  updateProject,
} from "../utils/projectManager";

const API_URL = import.meta.env.VITE_API_URL;
const EXPLAIN_URL = `${API_URL}/api/explain`;
const INTENT_URL = `${API_URL}/api/intent`;
const VISUALIZE_URL = `${API_URL}/api/visualize`;
const EXPORT_URL = `${API_URL}/api/export`;

let toastIdCounter = 0;

// ── Default file contents ──
const DEFAULT_FILES = {
  "project/index.js": `// Welcome to AI Code Editor ✨
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

main();`,
  "project/App.js": `import React from 'react';

function App() {
  return (
    <div className="app">
      <h1>Hello World</h1>
      <p>Welcome to the AI Code Editor</p>
    </div>
  );
}

export default App;`,
  "project/utils/helper.js": `// Utility helper functions

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}`,
  "project/styles.css": `/* Main Styles */
:root {
  --primary: #6366f1;
  --bg: #0a0e1a;
  --text: #f1f5f9;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
  background-color: var(--bg);
  color: var(--text);
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}`,
  "project/README.md": `# AI Code Editor

A modern AI-powered code editor with:
- Code explanation
- Optimization & debugging
- Function visualization

## Getting Started

1. Write your code in the editor
2. Use AI tools from the toolbar
3. View results in the right panel
`,
};

// ── Build tree from flat file paths ──
function buildFileTree(files) {
  const tree = { __isFolder: true };

  Object.keys(files).forEach((filePath) => {
    const parts = filePath.split("/");

    let current = tree;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        // Last part is the file
        current[part] = files[filePath];
      } else {
        // Intermediate parts are folders
        if (!current[part] || !current[part].__isFolder) {
          current[part] = { __isFolder: true };
        }
        current = current[part];
      }
    });
  });

  return tree;
}

// ── Get file name from full path ──
function getFileName(path) {
  if (!path) return "untitled";
  const parts = path.split("/");
  return parts[parts.length - 1];
}

export default function Home() {
  const navigate = useNavigate();
  const editorRef = useRef(null);

  // ── Load active project from projectManager ──
  const projectId = getActiveProjectId();
  const projectData = projectId ? getProject(projectId) : null;

  // ── Multi-file state (loaded from active project) ──
  const [files, setFiles] = useState(() => {
    if (projectData) return projectData.files || DEFAULT_FILES;
    return DEFAULT_FILES;
  });
  const [activeFile, setActiveFile] = useState(() => {
    if (projectData) {
      const saved = projectData.activeFile;
      if (saved && Object.prototype.hasOwnProperty.call(projectData.files || {}, saved)) return saved;
      const keys = Object.keys(projectData.files || {});
      return keys.length > 0 ? keys[0] : "project/index.js";
    }
    return "project/index.js";
  });
  const [openTabs, setOpenTabs] = useState(() => {
    if (projectData) {
      const savedTabs = projectData.openTabs || [];
      const allFiles = projectData.files || {};
      const valid = savedTabs.filter((t) => Object.prototype.hasOwnProperty.call(allFiles, t));
      return valid.length > 0 ? valid : Object.keys(allFiles).slice(0, 1);
    }
    return ["project/index.js"];
  });
  const [explorerCollapsed, setExplorerCollapsed] = useState(false);

  // ── Redirect to dashboard if no active project ──
  useEffect(() => {
    if (!projectId || !projectData) {
      navigate("/", { replace: true });
    }
  }, [projectId, projectData, navigate]);

  // ── Back to Dashboard handler ──
  const handleBackToDashboard = useCallback(() => {
    // Save current state before leaving
    if (projectId) {
      updateProject(projectId, { files, activeFile, openTabs });
    }
    navigate("/");
  }, [projectId, files, activeFile, openTabs, navigate]);

  // Tab state
  const [activeTab, setActiveTab] = useState("explain");
  const [showPanel, setShowPanel] = useState(true);

  // Explain state
  const [explanation, setExplanation] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState("");

  // Intent state
  const [intent, setIntent] = useState("optimize");
  const [result, setResult] = useState("");
  const [originalCode, setOriginalCode] = useState("");
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState("");

  // Visualize state
  const [showFlowView, setShowFlowView] = useState(false);
  const [vizData, setVizData] = useState(null);
  const [vizLoading, setVizLoading] = useState(false);
  const [vizError, setVizError] = useState("");

  // AI Project Generator
  const [showGenerator, setShowGenerator] = useState(false);

  // GitHub Import
  const [showGitHubImport, setShowGitHubImport] = useState(false);

  // AI Chat
  const [showChat, setShowChat] = useState(false);

  // Action Preview Modal
  const [pendingActions, setPendingActions] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // ── Undo / Redo History ──
  const MAX_HISTORY = 10;
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [highlightedFiles, setHighlightedFiles] = useState(new Set());
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const highlightTimerRef = useRef(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const isAnyLoading = explainLoading || intentLoading || vizLoading;

  // ── Auto-save to active project (debounced) ──
  useEffect(() => {
    if (!projectId) return;
    const timer = setTimeout(() => {
      updateProject(projectId, { files, activeFile, openTabs });
    }, 500);
    return () => clearTimeout(timer);
  }, [files, activeFile, openTabs, projectId]);

  // ── File tree derived from flat state ──
  const fileTree = buildFileTree(files);

  // ── File operations ──
  const handleSelectFile = useCallback(
    (path) => {
      if (!Object.prototype.hasOwnProperty.call(files, path)) return;
      setActiveFile(path);
      // Add to open tabs if not already there
      setOpenTabs((prev) =>
        prev.includes(path) ? prev : [...prev, path]
      );
    },
    [files]
  );

  const handleCloseTab = useCallback(
    (path) => {
      setOpenTabs((prev) => {
        const next = prev.filter((t) => t !== path);
        // If closing the active tab, switch to another
        if (path === activeFile && next.length > 0) {
          setActiveFile(next[next.length - 1]);
        } else if (next.length === 0) {
          // Nothing to show — keep last file
        }
        return next;
      });
    },
    [activeFile]
  );

  const handleContentChange = useCallback(
    (value) => {
      setFiles((prev) => ({
        ...prev,
        [activeFile]: value,
      }));
    },
    [activeFile]
  );

  const handleCreateFile = useCallback(
    (folderPath, fileName) => {
      // Build full path: folderPath/fileName
      const fullPath = `${folderPath}/${fileName}`;

      if (Object.prototype.hasOwnProperty.call(files, fullPath)) {
        addToast(`File "${fileName}" already exists!`, "error");
        return;
      }

      setFiles((prev) => ({
        ...prev,
        [fullPath]: `// ${fileName}\n`,
      }));

      // Auto-open the new file
      setActiveFile(fullPath);
      setOpenTabs((prev) =>
        prev.includes(fullPath) ? prev : [...prev, fullPath]
      );
      addToast(`Created ${fileName}`, "info");
    },
    [files, addToast]
  );

  const handleCreateFolder = useCallback(
    (parentPath, folderName) => {
      // Create a placeholder to represent the folder
      const folderKey = `${parentPath}/${folderName}/.gitkeep`;

      if (Object.prototype.hasOwnProperty.call(files, folderKey)) {
        addToast(`Folder "${folderName}" already exists!`, "error");
        return;
      }

      setFiles((prev) => ({
        ...prev,
        [folderKey]: "",
      }));

      addToast(`Created folder ${folderName}/`, "info");
    },
    [files, addToast]
  );

  const handleDeleteNode = useCallback(
    (path) => {
      // Check if path is a folder (any files starting with `path/`)
      const isFolder = Object.keys(files).some(
        (key) => key.startsWith(path + "/")
      );

      const confirmMsg = isFolder
        ? `Delete folder "${getFileName(path)}" and all contents?`
        : `Delete file "${getFileName(path)}"?`;

      if (!window.confirm(confirmMsg)) return;

      setFiles((prev) => {
        const next = { ...prev };

        if (isFolder) {
          // Delete all files inside the folder
          Object.keys(next).forEach((key) => {
            if (key.startsWith(path + "/") || key === path) {
              delete next[key];
            }
          });
        } else {
          delete next[path];
        }

        return next;
      });

      // Remove from open tabs
      setOpenTabs((prev) => {
        const next = prev.filter(
          (t) => t !== path && !t.startsWith(path + "/")
        );
        if ((path === activeFile || activeFile.startsWith(path + "/")) && next.length > 0) {
          setActiveFile(next[next.length - 1]);
        }
        return next;
      });

      addToast(`Deleted ${getFileName(path)}`, "info");
    },
    [files, activeFile, addToast]
  );

  const handleRenameNode = useCallback(
    (oldPath, newName) => {
      const parts = oldPath.split("/");
      parts[parts.length - 1] = newName;
      const newPath = parts.join("/");

      // Check if any file uses this path
      const isFolder = Object.keys(files).some(
        (key) => key.startsWith(oldPath + "/")
      );

      setFiles((prev) => {
        const next = {};

        Object.entries(prev).forEach(([key, val]) => {
          if (isFolder) {
            if (key.startsWith(oldPath + "/")) {
              const suffix = key.slice(oldPath.length);
              next[newPath + suffix] = val;
            } else {
              next[key] = val;
            }
          } else {
            if (key === oldPath) {
              next[newPath] = val;
            } else {
              next[key] = val;
            }
          }
        });

        return next;
      });

      // Update open tabs
      setOpenTabs((prev) =>
        prev.map((t) => {
          if (isFolder) {
            if (t.startsWith(oldPath + "/")) {
              return newPath + t.slice(oldPath.length);
            }
          } else if (t === oldPath) {
            return newPath;
          }
          return t;
        })
      );

      // Update active file
      if (isFolder && activeFile.startsWith(oldPath + "/")) {
        setActiveFile(newPath + activeFile.slice(oldPath.length));
      } else if (activeFile === oldPath) {
        setActiveFile(newPath);
      }

      addToast(`Renamed to ${newName}`, "info");
    },
    [files, activeFile, addToast]
  );

  // ── Import folder handler ──
  const handleImportFolder = useCallback(
    (importedFiles) => {
      const fileCount = Object.keys(importedFiles).length;
      if (fileCount === 0) {
        addToast("No importable files found in folder", "error");
        return;
      }

      setFiles((prev) => ({
        ...prev,
        ...importedFiles,
      }));

      // Auto-open the first imported file
      const firstFile = Object.keys(importedFiles)[0];
      setActiveFile(firstFile);
      setOpenTabs((prev) =>
        prev.includes(firstFile) ? prev : [...prev, firstFile]
      );

      addToast(`Imported ${fileCount} files`, "ai");
    },
    [addToast]
  );

  // ── Snapshot helper: saves current state before an AI change ──
  const saveSnapshot = useCallback((label = "AI Change") => {
    setUndoStack((prev) => {
      const snapshot = {
        files: structuredClone(files),
        activeFile,
        openTabs: [...openTabs],
        label,
        timestamp: Date.now(),
      };
      const next = [...prev, snapshot];
      // Keep max history
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    // Clear redo stack on new action
    setRedoStack([]);
  }, [files, activeFile, openTabs]);

  // ── AI Project Generator handler ──
  const handleGenerateProject = useCallback(
    (generatedFiles, projectName, mode) => {
      // ★ SNAPSHOT before generating project
      saveSnapshot(`AI Generate: ${projectName}`);

      // Convert AI-generated files to the flat file map (prepend "projectName/")
      const newFiles = {};
      generatedFiles.forEach((file) => {
        const fullPath = `${projectName}/${file.path}`;
        newFiles[fullPath] = file.content;
      });

      const firstFile = `${projectName}/${generatedFiles[0].path}`;

      if (mode === "replace") {
        // ── REPLACE MODE: Clear everything and create fresh project ──
        setFiles(newFiles);
        setActiveFile(firstFile);
        setOpenTabs([firstFile]);
      } else {
        // ── ADD MODE: Merge into existing project ──
        setFiles((prev) => ({
          ...prev,
          ...newFiles,
        }));
        setActiveFile(firstFile);
        setOpenTabs((prev) =>
          prev.includes(firstFile) ? prev : [...prev, firstFile]
        );
      }
    },
    [saveSnapshot]
  );

  // ── GitHub Import handler ──
  const handleGitHubImport = useCallback(
    (importedFiles, repoName, mode) => {
      // ★ SNAPSHOT before GitHub import
      saveSnapshot(`GitHub Import: ${repoName}`);

      const firstFile = Object.keys(importedFiles)[0];
      if (!firstFile) return;

      if (mode === "replace") {
        setFiles(importedFiles);
        setActiveFile(firstFile);
        setOpenTabs([firstFile]);
      } else {
        setFiles((prev) => ({ ...prev, ...importedFiles }));
        setActiveFile(firstFile);
        setOpenTabs((prev) =>
          prev.includes(firstFile) ? prev : [...prev, firstFile]
        );
      }
    },
    [saveSnapshot]
  );

  // ── AI Chat: Preview actions (instead of applying immediately) ──
  const handlePreviewActions = useCallback((actions) => {
    setPendingActions(actions);
    setShowPreviewModal(true);
  }, []);

  // ── Undo function ──
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) {
      addToast("Nothing to undo", "info");
      return;
    }

    // Save current state to redo stack
    setRedoStack((prev) => [
      ...prev,
      {
        files: structuredClone(files),
        activeFile,
        openTabs: [...openTabs],
        label: "Before Undo",
        timestamp: Date.now(),
      },
    ]);

    // Pop last snapshot
    const snapshot = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    // Compute which files changed for highlighting
    const changedFiles = new Set();
    const allPaths = new Set([
      ...Object.keys(files),
      ...Object.keys(snapshot.files),
    ]);
    allPaths.forEach((path) => {
      if (files[path] !== snapshot.files[path]) {
        changedFiles.add(path);
      }
    });

    // Restore state
    setFiles(snapshot.files);
    setActiveFile(snapshot.activeFile);
    setOpenTabs(snapshot.openTabs);

    // Highlight reverted files
    setHighlightedFiles(changedFiles);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedFiles(new Set());
    }, 2500);

    addToast(`Reverted: ${snapshot.label}`, "success");
  }, [undoStack, files, activeFile, openTabs, addToast]);

  // ── Redo function ──
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) {
      addToast("Nothing to redo", "info");
      return;
    }

    // Save current state to undo stack
    setUndoStack((prev) => [
      ...prev,
      {
        files: structuredClone(files),
        activeFile,
        openTabs: [...openTabs],
        label: "Before Redo",
        timestamp: Date.now(),
      },
    ]);

    // Pop last redo snapshot
    const snapshot = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    // Compute which files changed
    const changedFiles = new Set();
    const allPaths = new Set([
      ...Object.keys(files),
      ...Object.keys(snapshot.files),
    ]);
    allPaths.forEach((path) => {
      if (files[path] !== snapshot.files[path]) {
        changedFiles.add(path);
      }
    });

    // Restore
    setFiles(snapshot.files);
    setActiveFile(snapshot.activeFile);
    setOpenTabs(snapshot.openTabs);

    // Highlight
    setHighlightedFiles(changedFiles);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedFiles(new Set());
    }, 2500);

    addToast("Reapplied AI change", "success");
  }, [redoStack, files, activeFile, openTabs, addToast]);

  // Clean up highlight timer on unmount
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // ── AI Chat: Apply confirmed actions ──
  const handleApplyPendingActions = useCallback(() => {
    if (!pendingActions || pendingActions.length === 0) return;

    // ★ SNAPSHOT before applying AI changes
    const actionLabel = pendingActions
      .map((a) => `${a.type} ${a.path.split('/').pop()}`)
      .slice(0, 3)
      .join(", ");
    saveSnapshot(`AI: ${actionLabel}`);

    let firstModifiedFile = null;

    setFiles((prev) => {
      const next = { ...prev };

      for (const action of pendingActions) {
        switch (action.type) {
          case "create":
            next[action.path] = action.content || "";
            if (!firstModifiedFile) firstModifiedFile = action.path;
            break;
          case "update":
            if (Object.prototype.hasOwnProperty.call(next, action.path)) {
              next[action.path] = action.content || "";
              if (!firstModifiedFile) firstModifiedFile = action.path;
            } else {
              // If the file doesn't exist, create it
              next[action.path] = action.content || "";
              if (!firstModifiedFile) firstModifiedFile = action.path;
            }
            break;
          case "delete":
            delete next[action.path];
            break;
          default:
            break;
        }
      }

      return next;
    });

    // Auto-open the first modified/created file
    if (firstModifiedFile) {
      setActiveFile(firstModifiedFile);
      setOpenTabs((prev) =>
        prev.includes(firstModifiedFile)
          ? prev
          : [...prev, firstModifiedFile]
      );
    }

    // Remove deleted files from open tabs
    const deletedPaths = pendingActions
      .filter((a) => a.type === "delete")
      .map((a) => a.path);
    if (deletedPaths.length > 0) {
      setOpenTabs((prev) => {
        const next = prev.filter((t) => !deletedPaths.includes(t));
        if (deletedPaths.includes(activeFile) && next.length > 0) {
          setActiveFile(next[next.length - 1]);
        }
        return next;
      });
    }

    const actionSummary = pendingActions
      .map((a) => `${a.type}: ${a.path}`)
      .join(", ");
    addToast(`Applied changes: ${actionSummary}`, "ai");

    // Clear preview state
    setPendingActions(null);
    setShowPreviewModal(false);
  }, [pendingActions, activeFile, addToast, saveSnapshot]);

  // ── AI Chat: Cancel pending actions ──
  const handleCancelPendingActions = useCallback(() => {
    setPendingActions(null);
    setShowPreviewModal(false);
    addToast("AI changes discarded", "info");
  }, [addToast]);

  // ── Export / Download handler ──
  const handleExportProject = useCallback(async () => {
    const fileCount = Object.keys(files).length;
    if (fileCount === 0) {
      addToast("No files to export!", "error");
      return;
    }

    // Derive project name from root folder
    const firstPath = Object.keys(files)[0];
    const projectName = firstPath.split("/")[0] || "project";

    addToast("Preparing download…", "info");

    try {
      const res = await fetch(EXPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, projectName }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.error || "Export failed", "error");
        return;
      }

      // Download the ZIP blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast(`Downloaded ${projectName}.zip (${fileCount} files)`, "success");
    } catch {
      addToast(
        "Cannot reach the backend server. Make sure it is running on port 5000.",
        "error"
      );
    }
  }, [files, addToast]);

  // ── Get current code ──
  const getCurrentCode = useCallback(() => {
    return editorRef.current?.getValue?.() || files[activeFile] || "";
  }, [files, activeFile]);

  // ── Handlers ──

  const handleExplain = useCallback(async () => {
    const code = getCurrentCode();
    if (!code || !code.trim()) {
      addToast("Write some code first!", "error");
      return;
    }

    setShowPanel(true);
    setActiveTab("explain");
    setExplainLoading(true);
    setExplainError("");
    setExplanation("");

    try {
      const res = await fetch(EXPLAIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const response = await res.json();
      if (!response.success) {
        setExplainError(response.error || "Something went wrong.");
      } else {
        setExplanation(response.data.explanation);
        addToast("AI explanation ready", "ai");
      }
    } catch {
      setExplainError(
        "Cannot reach the backend server. Make sure it is running on port 5000."
      );
    } finally {
      setExplainLoading(false);
    }
  }, [addToast, getCurrentCode]);

  const handleApplyIntent = useCallback(async (overrideIntent) => {
    const code = getCurrentCode();
    if (!code || !code.trim()) {
      addToast("Write some code first!", "error");
      return;
    }

    const usedIntent = overrideIntent || intent;
    if (overrideIntent) setIntent(overrideIntent);

    setShowPanel(true);
    setActiveTab("result");
    setOriginalCode(code);
    setIntentLoading(true);
    setIntentError("");
    setResult("");

    try {
      const res = await fetch(INTENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, intent: usedIntent }),
      });

      const response = await res.json();
      if (!response.success) {
        setIntentError(response.error || "Something went wrong.");
      } else {
        setResult(response.data.result);
        addToast("AI response ready", "ai");
      }
    } catch {
      setIntentError(
        "Cannot reach the backend server. Make sure it is running on port 5000."
      );
    } finally {
      setIntentLoading(false);
    }
  }, [addToast, intent, getCurrentCode]);

  const handleVisualize = useCallback(async () => {
    const code = getCurrentCode();
    if (!code || !code.trim()) {
      addToast("Write some code first!", "error");
      return;
    }

    setShowPanel(true);
    setActiveTab("visualize");
    setVizLoading(true);
    setVizError("");
    setVizData(null);

    try {
      const res = await fetch(VISUALIZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const response = await res.json();
      if (!response.success) {
        setVizError(response.error || "Something went wrong.");
      } else if (!response.data.nodes || response.data.nodes.length === 0) {
        setVizError(
          response.data.warning ||
            "No functions were detected. Try adding some function definitions."
        );
      } else {
        setVizData(response.data);
        addToast(`Found ${response.data.nodes.length} functions`, "ai");
      }
    } catch {
      setVizError(
        "Cannot reach the backend server. Make sure it is running on port 5000."
      );
    } finally {
      setVizLoading(false);
    }
  }, [addToast, getCurrentCode]);

  const handleFormatDocument = useCallback(async () => {
    const code = getCurrentCode();
    if (!code || !code.trim()) {
      addToast("Nothing to format!", "error");
      return;
    }
    try {
      const formatted = await formatCode(code, activeFile);
      if (formatted !== code) {
        handleContentChange(formatted);
        addToast("Code formatted", "success");
      } else {
        addToast("Code is already formatted", "info");
      }
    } catch (_err) {
      addToast("Formatting failed", "error");
    }
  }, [getCurrentCode, activeFile, handleContentChange, addToast]);

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      // Ctrl+S → Format Document
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleFormatDocument();
      }
      // Ctrl+Shift+E → Explain
      if (e.ctrlKey && e.shiftKey && e.key === "E") {
        e.preventDefault();
        handleExplain();
      }
      // Ctrl+Shift+A → Apply AI
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        handleApplyIntent();
      }
      // Ctrl+Shift+V → Visualize
      if (e.ctrlKey && e.shiftKey && e.key === "V") {
        e.preventDefault();
        handleVisualize();
      }
      // Ctrl+B → Toggle Panel
      if (e.ctrlKey && !e.shiftKey && e.key === "b") {
        e.preventDefault();
        setShowPanel((prev) => !prev);
      }
      // Ctrl+\ → Toggle Explorer
      if (e.ctrlKey && e.key === "\\") {
        e.preventDefault();
        setExplorerCollapsed((prev) => !prev);
      }
      // Ctrl+Shift+G → AI Project Generator
      if (e.ctrlKey && e.shiftKey && e.key === "G") {
        e.preventDefault();
        setShowGenerator((prev) => !prev);
      }
      // Ctrl+Shift+C → AI Chat
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        setShowChat((prev) => !prev);
      }
      // Ctrl+Z → Undo AI (only when not in editor focus)
      if (e.ctrlKey && e.shiftKey && e.key === "Z") {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Y → Redo AI
      if (e.ctrlKey && e.shiftKey && e.key === "Y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleExplain, handleApplyIntent, handleVisualize, handleFormatDocument, handleUndo, handleRedo]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* ── Navbar ── */}
      <Navbar
        intent={intent}
        setIntent={setIntent}
        onExplain={handleExplain}
        onApplyAI={() => handleApplyIntent()}
        onVisualize={handleVisualize}
        onOpenGenerator={() => setShowGenerator(true)}
        onOpenGitHubImport={() => setShowGitHubImport(true)}
        onExportProject={handleExportProject}
        onToggleChat={() => setShowChat((v) => !v)}
        showChat={showChat}
        onFormat={handleFormatDocument}
        isLoading={isAnyLoading}
        explainLoading={explainLoading}
        intentLoading={intentLoading}
        vizLoading={vizLoading}
        fileName={getFileName(activeFile)}
        projectName={projectData?.name}
        onBackToDashboard={handleBackToDashboard}
        onUndo={handleUndo}
        onRedo={handleRedo}
        undoCount={undoStack.length}
        redoCount={redoStack.length}
        undoStack={undoStack}
        showHistoryPanel={showHistoryPanel}
        onToggleHistory={() => setShowHistoryPanel((v) => !v)}
      />

      {/* ── Main Content: Explorer + Editor + Panel ── */}
      <div className="main-split-layout flex flex-1 min-h-0">
        {/* File Explorer */}
        <FileExplorer
          fileTree={fileTree}
          activeFile={activeFile}
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onDeleteNode={handleDeleteNode}
          onRenameNode={handleRenameNode}
          onImportFolder={handleImportFolder}
          collapsed={explorerCollapsed}
          onToggleCollapse={() => setExplorerCollapsed((v) => !v)}
          highlightedFiles={highlightedFiles}
        />

        {/* Editor Area */}
        <CodeEditor
          editorRef={editorRef}
          activeFile={activeFile}
          fileContent={files[activeFile] || ""}
          onContentChange={handleContentChange}
          openTabs={openTabs}
          onSelectTab={handleSelectFile}
          onCloseTab={handleCloseTab}
        />

        {/* Right Panel */}
        {showPanel && (
          <TabPanel
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            explanation={explanation}
            explainLoading={explainLoading}
            explainError={explainError}
            result={result}
            intentLoading={intentLoading}
            intentError={intentError}
            intent={intent}
            originalCode={originalCode}
            vizData={vizData}
            vizLoading={vizLoading}
            vizError={vizError}
            onOpenFlowView={() => setShowFlowView(true)}
            onClose={() => setShowPanel(false)}
            onToast={addToast}
          />
        )}

        {/* AI Chat Panel */}
        {showChat && (
          <ChatPanel
            files={files}
            activeFile={activeFile}
            onPreviewActions={handlePreviewActions}
            onClose={() => setShowChat(false)}
            onToast={addToast}
          />
        )}
      </div>

      {/* ── Status Bar ── */}
      <StatusBar isLoading={isAnyLoading} />

      {/* ── Floating Toolbar ── */}
      <FloatingToolbar
        editorRef={editorRef}
        onExplain={handleExplain}
        onOptimize={() => handleApplyIntent("optimize")}
        onDebug={() => handleApplyIntent("debug")}
        isLoading={isAnyLoading}
      />

      {/* ── AI Project Generator Overlay ── */}
      {showGenerator && (
        <Suspense fallback={null}>
          <AIProjectGenerator
            onGenerate={handleGenerateProject}
            onClose={() => setShowGenerator(false)}
            onToast={addToast}
          />
        </Suspense>
      )}

      {/* ── GitHub Import Overlay ── */}
      {showGitHubImport && (
        <Suspense fallback={null}>
          <GitHubImport
            onImport={handleGitHubImport}
            onClose={() => setShowGitHubImport(false)}
            onToast={addToast}
          />
        </Suspense>
      )}

      {/* ── Flow Visualization Overlay ── */}
      {showFlowView && (
        <Suspense fallback={null}>
          <FlowView
            data={vizData}
            loading={vizLoading}
            error={vizError}
            onClose={() => {
              setShowFlowView(false);
              setVizData(null);
              setVizError("");
            }}
          />
        </Suspense>
      )}

      {/* ── Action Preview Modal ── */}
      {showPreviewModal && pendingActions && (
        <Suspense fallback={null}>
          <ActionPreviewModal
            actions={pendingActions}
            onApply={handleApplyPendingActions}
            onCancel={handleCancelPendingActions}
            existingFiles={files}
          />
        </Suspense>
      )}

      {/* ── Toast Notifications ── */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
