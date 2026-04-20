import { useState, useEffect, useRef } from "react";
import { Sparkles, Zap, Bug, X } from "lucide-react";

export default function FloatingToolbar({
  editorRef,
  onExplain,
  onOptimize,
  onDebug,
  isLoading,
}) {
  const [position, setPosition] = useState(null);
  const [visible, setVisible] = useState(false);
  const toolbarRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const editor = editorRef?.current;
    if (!editor) return;

    const handleSelectionChange = () => {
      const selection = editor.getSelection();
      if (!selection || selection.isEmpty()) {
        // Delay hide for better UX
        timeoutRef.current = setTimeout(() => setVisible(false), 200);
        return;
      }

      // Clear any pending hide
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const selectedText = editor.getModel()?.getValueInRange(selection);
      if (!selectedText || selectedText.trim().length < 3) {
        setVisible(false);
        return;
      }

      // Get the position for the toolbar
      const endPos = selection.getEndPosition();
      const coords = editor.getScrolledVisiblePosition(endPos);
      const editorDom = editor.getDomNode();

      if (coords && editorDom) {
        const editorRect = editorDom.getBoundingClientRect();
        setPosition({
          x: editorRect.left + coords.left,
          y: editorRect.top + coords.top + coords.height + 8,
        });
        setVisible(true);
      }
    };

    const disposable = editor.onDidChangeCursorSelection(handleSelectionChange);

    return () => {
      disposable?.dispose();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [editorRef]);

  if (!visible || !position) return null;

  return (
    <div
      ref={toolbarRef}
      className="floating-toolbar glass-panel"
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        gap: "2px",
        padding: "4px",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg), 0 0 0 1px var(--border-default)",
      }}
    >
      <ToolbarButton
        icon={Sparkles}
        label="Explain"
        onClick={() => { onExplain(); setVisible(false); }}
        color="var(--accent-primary)"
        disabled={isLoading}
      />
      <ToolbarButton
        icon={Zap}
        label="Optimize"
        onClick={() => { onOptimize(); setVisible(false); }}
        color="var(--success)"
        disabled={isLoading}
      />
      <ToolbarButton
        icon={Bug}
        label="Debug"
        onClick={() => { onDebug(); setVisible(false); }}
        color="var(--warning)"
        disabled={isLoading}
      />
      <div
        style={{
          width: "1px",
          height: "20px",
          background: "var(--border-default)",
          margin: "0 2px",
        }}
      />
      <button
        onClick={() => setVisible(false)}
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "var(--radius-sm)",
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all var(--duration-fast)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239,68,68,0.1)";
          e.currentTarget.style.color = "var(--danger-light)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-muted)";
        }}
        title="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, onClick, color, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 10px",
        borderRadius: "var(--radius-sm)",
        background: "transparent",
        border: "none",
        color: "var(--text-secondary)",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all var(--duration-fast)",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = `${color}15`;
          e.currentTarget.style.color = color;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
    >
      <Icon size={12} />
      <span>{label}</span>
    </button>
  );
}
