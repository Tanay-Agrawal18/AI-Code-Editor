import { useState, useRef, useCallback, useEffect } from "react";
import Navbar from "../components/Navbar";
import CodeEditor from "../components/CodeEditor";
import TabPanel from "../components/TabPanel";
import FloatingToolbar from "../components/FloatingToolbar";
import FlowView from "../components/FlowView";
import ToastContainer from "../components/ToastContainer";
import StatusBar from "../components/StatusBar";

const EXPLAIN_URL = "http://127.0.0.1:5000/api/explain";
const INTENT_URL = "http://127.0.0.1:5000/api/intent";
const VISUALIZE_URL = "http://127.0.0.1:5000/api/visualize";

let toastIdCounter = 0;

export default function Home() {
  const editorRef = useRef(null);

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

  // ── Handlers ──

  const handleExplain = useCallback(async () => {
    const code = editorRef.current?.getValue?.();
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

      const data = await res.json();
      if (!res.ok) {
        setExplainError(data.error || "Something went wrong.");
      } else {
        setExplanation(data.explanation);
        addToast("AI explanation ready", "ai");
      }
    } catch {
      setExplainError(
        "Cannot reach the backend server. Make sure it is running on port 5000."
      );
    } finally {
      setExplainLoading(false);
    }
  }, [addToast]);

  const handleApplyIntent = useCallback(async (overrideIntent) => {
    const code = editorRef.current?.getValue?.();
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

      const data = await res.json();
      if (!res.ok) {
        setIntentError(data.error || "Something went wrong.");
      } else {
        setResult(data.result);
        addToast("AI response ready", "ai");
      }
    } catch {
      setIntentError(
        "Cannot reach the backend server. Make sure it is running on port 5000."
      );
    } finally {
      setIntentLoading(false);
    }
  }, [addToast, intent]);

  const handleVisualize = useCallback(async () => {
    const code = editorRef.current?.getValue?.();
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

      const data = await res.json();
      if (!res.ok) {
        setVizError(data.error || "Something went wrong.");
      } else if (!data.nodes || data.nodes.length === 0) {
        setVizError(
          data.warning ||
            "No functions were detected. Try adding some function definitions."
        );
      } else {
        setVizData(data);
        addToast(`Found ${data.nodes.length} functions`, "ai");
      }
    } catch {
      setVizError(
        "Cannot reach the backend server. Make sure it is running on port 5000."
      );
    } finally {
      setVizLoading(false);
    }
  }, [addToast]);

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handler = (e) => {
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
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleExplain, handleApplyIntent, handleVisualize]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* ── Navbar ── */}
      <Navbar
        intent={intent}
        setIntent={setIntent}
        onExplain={handleExplain}
        onApplyAI={() => handleApplyIntent()}
        onVisualize={handleVisualize}
        isLoading={isAnyLoading}
        explainLoading={explainLoading}
        intentLoading={intentLoading}
        vizLoading={vizLoading}
      />

      {/* ── Main Content: Editor + Panel ── */}
      <div className="main-split-layout flex flex-1 min-h-0">
        {/* Editor Area */}
        <CodeEditor editorRef={editorRef} />

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

      {/* ── Flow Visualization Overlay ── */}
      {showFlowView && (
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
      )}

      {/* ── Toast Notifications ── */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
