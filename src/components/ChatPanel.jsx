import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  X,
  Loader2,
  MessageSquare,
  Bot,
  User,
  FileCode,
  FilePlus,
  FileX,
  Sparkles,
  ArrowDown,
  Trash2,
  CheckCircle2,
  Circle,
  Brain,
  Zap,
  ListChecks,
  Shield,
  ShieldCheck,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const CHAT_URL = `${API_URL}/api/chat`;

// ── Render file action badges ──
function ActionBadge({ action }) {
  const config = {
    create: {
      icon: <FilePlus size={11} />,
      label: "Created",
      bg: "rgba(16,185,129,0.12)",
      border: "rgba(16,185,129,0.25)",
      color: "#34d399",
    },
    update: {
      icon: <FileCode size={11} />,
      label: "Updated",
      bg: "rgba(99,102,241,0.12)",
      border: "rgba(99,102,241,0.25)",
      color: "#818cf8",
    },
    delete: {
      icon: <FileX size={11} />,
      label: "Deleted",
      bg: "rgba(239,68,68,0.12)",
      border: "rgba(239,68,68,0.25)",
      color: "#f87171",
    },
  };

  const c = config[action.type] || config.update;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 8px",
        borderRadius: "6px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        fontSize: "11px",
        fontWeight: 600,
        color: c.color,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {c.icon}
      <span style={{ opacity: 0.7 }}>{c.label}</span>
      <span>{action.path}</span>
    </div>
  );
}

// ── Step Executor — shows steps with per-step status ──
function StepExecutor({ steps, stepStatuses, currentStepIndex, fixStepCount = 0 }) {
  if (!steps || steps.length === 0) return null;

  const completedCount = stepStatuses.filter((s) => s === "done").length;
  const mainStepCount = steps.length - fixStepCount;

  return (
    <div className="agent-plan-checklist">
      <div className="agent-plan-header">
        <div className="agent-plan-icon">
          <ListChecks size={12} color="#818cf8" />
        </div>
        <span className="agent-plan-title">Execution Plan</span>
        <span className="agent-plan-count">
          {completedCount} / {steps.length} steps
        </span>
      </div>

      {/* Progress bar */}
      <div className="agent-step-progress-bar">
        <div
          className="agent-step-progress-fill"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="agent-plan-steps">
        {steps.map((step, i) => {
          const status = stepStatuses[i] || "pending";
          const isFixStep = fixStepCount > 0 && i >= mainStepCount;
          const statusClass =
            status === "done"
              ? "completed"
              : status === "running"
              ? "running"
              : "";

          return (
            <div key={i}>
              {/* Divider before fix steps */}
              {isFixStep && i === mainStepCount && (
                <div className="agent-fix-divider">
                  <Shield size={10} />
                  <span>Self-Correction</span>
                </div>
              )}
              <div
                className={`agent-plan-step ${statusClass} ${isFixStep ? "fix-step" : ""}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="agent-plan-step-icon">
                  {status === "done" ? (
                    <CheckCircle2 size={14} />
                  ) : status === "running" ? (
                    <Loader2
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <Circle size={14} />
                  )}
                </div>
                <div className="agent-step-content">
                  <span className="agent-plan-step-text">{step.title}</span>
                  {/* Show action badges for completed or running step */}
                  {(status === "done" || status === "running") &&
                    step.actions &&
                    step.actions.length > 0 && (
                      <div className="agent-step-actions">
                        {step.actions.map((action, j) => (
                          <ActionBadge key={j} action={action} />
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Single chat message bubble ──
function ChatMessage({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: "6px",
        animation: "fadeInUp 0.25s ease-out",
      }}
    >
      {/* Avatar + Label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexDirection: isUser ? "row-reverse" : "row",
        }}
      >
        <div
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isUser
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "linear-gradient(135deg, #10b981, #34d399)",
            boxShadow: isUser
              ? "0 2px 8px rgba(99,102,241,0.3)"
              : "0 2px 8px rgba(16,185,129,0.3)",
            flexShrink: 0,
          }}
        >
          {isUser ? (
            <User size={12} color="#fff" />
          ) : (
            <Bot size={12} color="#fff" />
          )}
        </div>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--text-muted)",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}
        >
          {isUser ? "You" : "AI Agent"}
        </span>
      </div>

      {/* Step Executor (only for AI messages with steps) */}
      {!isUser && msg.steps && msg.steps.length > 0 && (
        <StepExecutor
          steps={msg.steps}
          stepStatuses={msg.stepStatuses || msg.steps.map(() => "done")}
          currentStepIndex={-1}
          fixStepCount={msg.fixStepCount || 0}
        />
      )}

      {/* Confidence Badge */}
      {!isUser && typeof msg.confidence === "number" && (
        <ConfidenceBadge confidence={msg.confidence} />
      )}

      {/* Self-correction notice */}
      {!isUser && msg.fixStepCount > 0 && (
        <div className="agent-self-corrected-notice">
          <Shield size={11} />
          <span>Self-corrected {msg.fixStepCount} issue{msg.fixStepCount > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Message Bubble */}
      <div
        style={{
          maxWidth: "92%",
          padding: "10px 14px",
          borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          background: isUser
            ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))"
            : "rgba(255,255,255,0.04)",
          border: `1px solid ${isUser ? "rgba(99,102,241,0.2)" : "var(--border-default)"}`,
          fontSize: "13px",
          lineHeight: "1.6",
          color: "var(--text-primary)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ── Confidence Badge ──
function ConfidenceBadge({ confidence }) {
  if (typeof confidence !== "number") return null;

  let label, color, bg, border;
  if (confidence >= 0.85) {
    label = "High";
    color = "#34d399";
    bg = "rgba(16,185,129,0.1)";
    border = "rgba(16,185,129,0.25)";
  } else if (confidence >= 0.6) {
    label = "Medium";
    color = "#fbbf24";
    bg = "rgba(245,158,11,0.1)";
    border = "rgba(245,158,11,0.25)";
  } else {
    label = "Low";
    color = "#f87171";
    bg = "rgba(239,68,68,0.1)";
    border = "rgba(239,68,68,0.25)";
  }

  return (
    <div
      className="agent-confidence-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 9px",
        borderRadius: "8px",
        background: bg,
        border: `1px solid ${border}`,
        fontSize: "10px",
        fontWeight: 700,
        color,
        fontFamily: "'JetBrains Mono', monospace",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <ShieldCheck size={11} />
      <span>Confidence: {label}</span>
      <span style={{ opacity: 0.6 }}>({Math.round(confidence * 100)}%)</span>
    </div>
  );
}

// ── Agent Thinking indicator with phases ──
function AgentThinkingIndicator({ phase }) {
  const phases = {
    thinking: {
      icon: <Brain size={12} color="#fff" />,
      label: "Thinking…",
      gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      glow: "rgba(99,102,241,0.3)",
    },
    planning: {
      icon: <ListChecks size={12} color="#fff" />,
      label: "Building plan…",
      gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
      glow: "rgba(245,158,11,0.3)",
    },
    executing: {
      icon: <Zap size={12} color="#fff" />,
      label: "Executing actions…",
      gradient: "linear-gradient(135deg, #10b981, #34d399)",
      glow: "rgba(16,185,129,0.3)",
    },
    reviewing: {
      icon: <Shield size={12} color="#fff" />,
      label: "Self-correcting…",
      gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
      glow: "rgba(139,92,246,0.4)",
    },
  };

  const p = phases[phase] || phases.thinking;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "6px",
        animation: "fadeInUp 0.2s ease-out",
      }}
    >
      <div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: p.gradient,
          boxShadow: `0 2px 8px ${p.glow}`,
          flexShrink: 0,
          animation: "thinkPulse 2s ease-in-out infinite",
        }}
      >
        {p.icon}
      </div>
      <div className="agent-thinking-bubble">
        <div className="agent-thinking-bar">
          <div className="agent-thinking-bar-fill" />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Loader2
            size={14}
            style={{
              color: "var(--accent-primary-light)",
              animation: "spin 1s linear infinite",
            }}
          />
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              fontStyle: "italic",
            }}
          >
            {p.label}
          </span>
          <div style={{ display: "flex", gap: "3px" }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "var(--accent-primary-light)",
                  animation: `dotBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ──
function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: "16px",
        padding: "40px 24px",
        animation: "fadeIn 0.4s ease-out",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
          border: "1px solid rgba(99,102,241,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Brain size={24} style={{ color: "var(--accent-primary-light)" }} />
        <div
          style={{
            position: "absolute",
            bottom: "-3px",
            right: "-3px",
            width: "18px",
            height: "18px",
            borderRadius: "6px",
            background: "linear-gradient(135deg, #10b981, #34d399)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid var(--bg-deepest)",
          }}
        >
          <Zap size={9} color="#fff" />
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "6px",
          }}
        >
          AI Agent Mode
        </h3>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            lineHeight: 1.5,
            maxWidth: "240px",
          }}
        >
          I plan step-by-step, then execute. Ask me to build features, fix bugs,
          or refactor code across multiple files.
        </p>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          width: "100%",
          maxWidth: "260px",
        }}
      >
        {[
          "Build a login page with validation",
          "Add error handling to all files",
          "Refactor components for reusability",
        ].map((suggestion, i) => (
          <div
            key={i}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border-subtle)",
              fontSize: "11px",
              color: "var(--text-secondary)",
              cursor: "default",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            🧠 "{suggestion}"
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// MAIN CHAT PANEL COMPONENT
// ══════════════════════════════════════════════════
export default function ChatPanel({
  files,
  activeFile,
  onPreviewActions,
  onClose,
  onToast,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState("thinking");
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // ── Step execution state ──
  const [liveSteps, setLiveSteps] = useState([]);
  const [liveStepStatuses, setLiveStepStatuses] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // ── Auto-scroll to bottom ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, liveStepStatuses, scrollToBottom]);

  // ── Track scroll position for "scroll to bottom" button ──
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 80);
  }, []);

  // ── Focus input on mount ──
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Delay helper ──
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // ── Send message ──
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Add user message
    const userMsg = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setThinkingPhase("thinking");

    // Reset step execution state
    setLiveSteps([]);
    setLiveStepStatuses([]);
    setCurrentStepIndex(-1);

    // Cycle through thinking phases for UX
    const phaseTimer1 = setTimeout(() => setThinkingPhase("planning"), 1500);
    const phaseTimer2 = setTimeout(() => setThinkingPhase("executing"), 3500);
    const phaseTimer3 = setTimeout(() => setThinkingPhase("reviewing"), 5500);

    try {
      // Build conversation history (last 10 messages for context)
      const history = [...messages, userMsg].slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Smart context building
      const SKIP_NAMES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", ".DS_Store", "Thumbs.db"];
      const SKIP_PATTERNS = /\.(lock|min\.js|min\.css|map|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp3|mp4|zip|tar|gz|exe|pdf)$/i;

      const contextFiles = {};
      const allPaths = [];

      for (const [path, content] of Object.entries(files)) {
        if (path.endsWith(".gitkeep") && content === "") continue;
        if (SKIP_NAMES.some((name) => path.endsWith(name))) continue;
        if (SKIP_PATTERNS.test(path)) continue;

        allPaths.push(path);

        if (path === activeFile) {
          const fileContent = typeof content === "string" ? content : "";
          contextFiles[path] = fileContent.length > 6000
            ? fileContent.slice(0, 3000) + "\n// ... (truncated)"
            : fileContent;
        }
      }

      const chatPayload = {
        message: trimmed,
        files: contextFiles,
        fileTree: allPaths,
        currentFile: activeFile,
        history,
      };

      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatPayload),
      });

      const response = await res.json();

      if (!response.success) {
        const errorMsg = {
          role: "assistant",
          content: `❌ Error: ${response.error || "Something went wrong."}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
        onToast?.(response.error || "Chat request failed", "error");
        return;
      }

      const data = response.data;

      // ── Step-by-step execution engine ──
      const steps = data.steps || [];
      const fixSteps = data.fixSteps || [];
      const confidence = typeof data.confidence === "number" ? data.confidence : null;
      const message = data.message || "Done.";

      if (steps.length > 0) {
        // Clear thinking phase — we're now in execution mode
        clearTimeout(phaseTimer1);
        clearTimeout(phaseTimer2);
        clearTimeout(phaseTimer3);
        setThinkingPhase("executing");

        // Initialize all steps as pending
        const initialStatuses = steps.map(() => "pending");
        setLiveSteps(steps);
        setLiveStepStatuses(initialStatuses);

        // Collect all actions for preview
        const allActions = [];

        // Execute steps one by one
        for (let i = 0; i < steps.length; i++) {
          setCurrentStepIndex(i);

          // Mark current step as running
          setLiveStepStatuses((prev) => {
            const next = [...prev];
            next[i] = "running";
            return next;
          });

          // Wait for UX visibility (300-500ms)
          await delay(350 + Math.random() * 200);

          // Collect step actions
          if (steps[i].actions && steps[i].actions.length > 0) {
            allActions.push(...steps[i].actions);
          }

          // Mark step as done
          setLiveStepStatuses((prev) => {
            const next = [...prev];
            next[i] = "done";
            return next;
          });

          // Small pause between steps for visual effect
          if (i < steps.length - 1) {
            await delay(200);
          }
        }

        // ── Self-Correction Phase ──
        if (fixSteps.length > 0) {
          setThinkingPhase("reviewing");
          await delay(600);

          // Append fix steps to live display
          const combinedSteps = [...steps, ...fixSteps];
          const combinedStatuses = [
            ...steps.map(() => "done"),
            ...fixSteps.map(() => "pending"),
          ];
          setLiveSteps(combinedSteps);
          setLiveStepStatuses(combinedStatuses);

          // Execute fix steps
          for (let i = 0; i < fixSteps.length; i++) {
            const globalIdx = steps.length + i;
            setCurrentStepIndex(globalIdx);

            // Mark fix step as running
            setLiveStepStatuses((prev) => {
              const next = [...prev];
              next[globalIdx] = "running";
              return next;
            });

            await delay(350 + Math.random() * 200);

            // Collect fix actions
            if (fixSteps[i].actions && fixSteps[i].actions.length > 0) {
              allActions.push(...fixSteps[i].actions);
            }

            // Mark fix step as done
            setLiveStepStatuses((prev) => {
              const next = [...prev];
              next[globalIdx] = "done";
              return next;
            });

            if (i < fixSteps.length - 1) {
              await delay(200);
            }
          }
        }

        // Queue all actions for preview
        if (allActions.length > 0) {
          onPreviewActions(allActions);
          onToast?.("AI actions ready for review", "ai");
        }

        // Build final combined steps and statuses
        const allSteps = fixSteps.length > 0 ? [...steps, ...fixSteps] : steps;
        const finalStatuses = allSteps.map(() => "done");

        // Add AI message with completed steps
        const aiMsg = {
          role: "assistant",
          content: message,
          steps: allSteps,
          stepStatuses: finalStatuses,
          fixStepCount: fixSteps.length,
          confidence,
        };
        setMessages((prev) => [...prev, aiMsg]);

        // Clear live execution state
        setLiveSteps([]);
        setLiveStepStatuses([]);
        setCurrentStepIndex(-1);
      } else {
        // No steps — just a text response
        const aiMsg = {
          role: "assistant",
          content: message,
          confidence,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch {
      const errorMsg = {
        role: "assistant",
        content:
          "❌ Cannot reach the backend server. Make sure it is running on port 5000.",
      };
      setMessages((prev) => [...prev, errorMsg]);
      onToast?.(
        "Cannot reach backend server. Make sure it is running.",
        "error"
      );
    } finally {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      clearTimeout(phaseTimer3);
      setIsLoading(false);
      setThinkingPhase("thinking");
      setLiveSteps([]);
      setLiveStepStatuses([]);
      setCurrentStepIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, isLoading, messages, files, activeFile, onPreviewActions, onToast]);

  // ── Keyboard handler ──
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ── Clear chat ──
  const handleClearChat = useCallback(() => {
    setMessages([]);
    onToast?.("Chat cleared", "info");
  }, [onToast]);

  return (
    <div className="chat-panel" id="ai-chat-panel">
      {/* ── Header ── */}
      <div className="chat-panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "8px",
              background:
                "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 10px var(--accent-glow)",
              position: "relative",
            }}
          >
            <Brain size={13} color="#fff" />
          </div>
          <div>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              AI Agent
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: "4px",
                  background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.15))",
                  border: "1px solid rgba(16,185,129,0.3)",
                  color: "#34d399",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Agent
              </span>
            </h3>
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
              }}
            >
              Plan → Execute → Review
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              title="Clear chat"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
                e.currentTarget.style.color = "#f87171";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <Trash2 size={12} />
            </button>
          )}
          <button
            onClick={onClose}
            title="Close chat"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={messagesContainerRef}
        className="chat-panel-messages"
        onScroll={handleScroll}
      >
        {messages.length === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "16px 14px",
            }}
          >
            {messages.map((msg, i) => (
              <ChatMessage key={i} msg={msg} />
            ))}

            {/* Live Step Executor — visible during step-by-step execution */}
            {liveSteps.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "6px",
                  animation: "fadeInUp 0.25s ease-out",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: thinkingPhase === "reviewing"
                        ? "linear-gradient(135deg, #8b5cf6, #a78bfa)"
                        : "linear-gradient(135deg, #10b981, #34d399)",
                      boxShadow: thinkingPhase === "reviewing"
                        ? "0 2px 8px rgba(139,92,246,0.4)"
                        : "0 2px 8px rgba(16,185,129,0.3)",
                      flexShrink: 0,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {thinkingPhase === "reviewing" ? (
                      <Shield size={12} color="#fff" />
                    ) : (
                      <Zap size={12} color="#fff" />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: thinkingPhase === "reviewing" ? "#a78bfa" : "var(--text-muted)",
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {thinkingPhase === "reviewing" ? "Self-correcting…" : "Executing…"}
                  </span>
                </div>
                <StepExecutor
                  steps={liveSteps}
                  stepStatuses={liveStepStatuses}
                  currentStepIndex={currentStepIndex}
                />
              </div>
            )}

            {/* Thinking indicator — only when waiting for AI (no live steps) */}
            {isLoading && liveSteps.length === 0 && (
              <AgentThinkingIndicator phase={thinkingPhase} />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll-to-bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            style={{
              position: "absolute",
              bottom: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-md)",
              zIndex: 5,
              animation: "fadeIn 0.15s ease-out",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-primary)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-elevated)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <ArrowDown size={14} />
          </button>
        )}
      </div>

      {/* ── Input Area ── */}
      <div className="chat-panel-input-area">
        <div className="chat-panel-input-row">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the agent to plan & execute…"
            disabled={isLoading}
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "13px",
              fontFamily: "'Inter', sans-serif",
              lineHeight: "1.5",
              maxHeight: "80px",
              overflowY: "auto",
            }}
            onInput={(e) => {
              // Auto-resize textarea
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 80) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            title="Send message (Enter)"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              border: "none",
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              background:
                isLoading || !input.trim()
                  ? "rgba(255,255,255,0.04)"
                  : "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              color: isLoading || !input.trim() ? "var(--text-muted)" : "#fff",
              boxShadow:
                isLoading || !input.trim()
                  ? "none"
                  : "0 2px 10px var(--accent-glow)",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
          >
            {isLoading ? (
              <Loader2
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
            }}
          >
            Enter to send · Shift+Enter for new line
          </span>
          <span
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {messages.length} msgs
          </span>
        </div>
      </div>
    </div>
  );
}
