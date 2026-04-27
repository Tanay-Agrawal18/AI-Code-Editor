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
} from "lucide-react";

const CHAT_URL = "http://127.0.0.1:5000/api/chat";

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
          {isUser ? "You" : "AI Assistant"}
        </span>
      </div>

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

      {/* File Actions */}
      {msg.actions && msg.actions.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            maxWidth: "92%",
          }}
        >
          {msg.actions.map((action, i) => (
            <ActionBadge key={i} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Thinking indicator ──
function ThinkingIndicator() {
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
          background: "linear-gradient(135deg, #10b981, #34d399)",
          boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
          flexShrink: 0,
          animation: "thinkPulse 2s ease-in-out infinite",
        }}
      >
        <Bot size={12} color="#fff" />
      </div>
      <div
        style={{
          padding: "10px 16px",
          borderRadius: "14px 14px 14px 4px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border-default)",
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
          AI is thinking…
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
        }}
      >
        <Sparkles size={24} style={{ color: "var(--accent-primary-light)" }} />
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
          AI Chat Assistant
        </h3>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            lineHeight: 1.5,
            maxWidth: "240px",
          }}
        >
          Ask me to create files, modify code, fix bugs, or explain your project.
          I can edit multiple files at once.
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
          "Create a login page component",
          "Add error handling to all files",
          "Explain the current file",
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
            💡 "{suggestion}"
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
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // ── Auto-scroll to bottom ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

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

  // ── Send message ──
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Add user message
    const userMsg = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation history (last 10 messages for context)
      const history = [...messages, userMsg].slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Smart context building: send active file + compact project tree
      // to stay within Groq's 12K TPM free tier limit
      const SKIP_NAMES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", ".DS_Store", "Thumbs.db"];
      const SKIP_PATTERNS = /\.(lock|min\.js|min\.css|map|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp3|mp4|zip|tar|gz|exe|pdf)$/i;

      // Build compact context: active file full content + tree of other files
      const contextFiles = {};
      const allPaths = [];

      for (const [path, content] of Object.entries(files)) {
        if (path.endsWith(".gitkeep") && content === "") continue;
        if (SKIP_NAMES.some((name) => path.endsWith(name))) continue;
        if (SKIP_PATTERNS.test(path)) continue;

        allPaths.push(path);

        // Send full content only for the active file
        if (path === activeFile) {
          const fileContent = typeof content === "string" ? content : "";
          contextFiles[path] = fileContent.length > 6000
            ? fileContent.slice(0, 3000) + "\n// ... (truncated)"
            : fileContent;
        }
      }

      // Build a lightweight payload with the file tree + active file content
      const chatPayload = {
        message: trimmed,
        files: contextFiles,
        fileTree: allPaths, // Just the paths for project awareness
        currentFile: activeFile,
        history,
      };

      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = {
          role: "assistant",
          content: `❌ Error: ${data.error || "Something went wrong."}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
        onToast?.(data.error || "Chat request failed", "error");
        return;
      }

      // Process actions
      const actions = data.actions || [];
      const message = data.message || "Done.";

      // Queue actions for preview instead of applying immediately
      if (actions.length > 0) {
        onPreviewActions(actions);
        onToast?.("AI actions ready for review", "ai");
      }

      // Add AI message with actions
      const aiMsg = {
        role: "assistant",
        content: message,
        actions: actions.length > 0 ? actions : undefined,
      };
      setMessages((prev) => [...prev, aiMsg]);
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
      setIsLoading(false);
      // Re-focus input
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
            }}
          >
            <MessageSquare size={13} color="#fff" />
          </div>
          <div>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              AI Chat
            </h3>
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
              }}
            >
              Multi-file operations
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
        {messages.length === 0 ? (
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
            {isLoading && <ThinkingIndicator />}
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
            placeholder="Ask AI to modify your project…"
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
