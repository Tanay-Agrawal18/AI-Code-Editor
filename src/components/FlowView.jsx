import { useState, useEffect, useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { X, Maximize2 } from "lucide-react";

/* ── Custom Node ── */
function FunctionNode({ data }) {
  return (
    <div
      style={{
        background: data.gradient || "linear-gradient(135deg, #6366f1, #8b5cf6)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 22px",
        color: "#fff",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        fontSize: "13px",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        boxShadow: `0 4px 24px ${data.glow || "rgba(99,102,241,0.35)"}`,
        border: `1px solid ${data.borderColor || "rgba(129,140,248,0.4)"}`,
        minWidth: "120px",
        textAlign: "center",
        cursor: "grab",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        position: "relative",
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: "10px",
          height: "10px",
          background: "#818cf8",
          border: "2px solid var(--bg-base, #0a0e1a)",
          top: "-5px",
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: "10px",
          height: "10px",
          background: "#818cf8",
          border: "2px solid var(--bg-base, #0a0e1a)",
          bottom: "-5px",
        }}
      />
      {/* Icon */}
      <div
        style={{
          position: "absolute",
          top: "-10px",
          left: "14px",
          width: "22px",
          height: "22px",
          borderRadius: "7px",
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          border: `1px solid ${data.borderColor || "rgba(129,140,248,0.4)"}`,
          backdropFilter: "blur(8px)",
        }}
      >
        ƒ
      </div>
      <div style={{ marginTop: "4px" }}>{data.label}</div>
      {data.calls != null && (
        <div
          style={{
            marginTop: "6px",
            fontSize: "10px",
            fontWeight: 500,
            color: "rgba(255,255,255,0.65)",
            letterSpacing: "0.03em",
          }}
        >
          {data.calls === 0
            ? "No outgoing calls"
            : `${data.calls} call${data.calls > 1 ? "s" : ""}`}
        </div>
      )}
    </div>
  );
}

/* ── Color Palettes for Nodes ── */
const NODE_THEMES = [
  {
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    glow: "rgba(99,102,241,0.35)",
    borderColor: "rgba(129,140,248,0.4)",
    mapColor: "#6366f1",
  },
  {
    gradient: "linear-gradient(135deg, #10b981, #34d399)",
    glow: "rgba(16,185,129,0.35)",
    borderColor: "rgba(52,211,153,0.4)",
    mapColor: "#10b981",
  },
  {
    gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    glow: "rgba(245,158,11,0.35)",
    borderColor: "rgba(251,191,36,0.4)",
    mapColor: "#f59e0b",
  },
  {
    gradient: "linear-gradient(135deg, #ec4899, #f472b6)",
    glow: "rgba(236,72,153,0.35)",
    borderColor: "rgba(244,114,182,0.4)",
    mapColor: "#ec4899",
  },
  {
    gradient: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    glow: "rgba(59,130,246,0.35)",
    borderColor: "rgba(96,165,250,0.4)",
    mapColor: "#3b82f6",
  },
  {
    gradient: "linear-gradient(135deg, #ef4444, #f87171)",
    glow: "rgba(239,68,68,0.35)",
    borderColor: "rgba(248,113,113,0.4)",
    mapColor: "#ef4444",
  },
  {
    gradient: "linear-gradient(135deg, #14b8a6, #2dd4bf)",
    glow: "rgba(20,184,166,0.35)",
    borderColor: "rgba(45,212,191,0.4)",
    mapColor: "#14b8a6",
  },
];

/* ── Layout: Arrange nodes in a grid ── */
function layoutNodes(names, edges) {
  const cols = Math.max(2, Math.ceil(Math.sqrt(names.length)));
  const xGap = 240;
  const yGap = 160;

  // Count outgoing calls per node
  const callCounts = {};
  names.forEach((n) => (callCounts[n] = 0));
  edges.forEach((e) => {
    if (callCounts[e.from] != null) callCounts[e.from]++;
  });

  return names.map((name, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const theme = NODE_THEMES[idx % NODE_THEMES.length];

    return {
      id: name,
      type: "functionNode",
      position: { x: col * xGap + 60, y: row * yGap + 60 },
      data: {
        label: name,
        calls: callCounts[name] || 0,
        ...theme,
      },
    };
  });
}

function buildEdges(edgesData) {
  return edgesData.map((e, idx) => ({
    id: `e-${idx}`,
    source: e.from,
    target: e.to,
    animated: true,
    style: { stroke: "#818cf8", strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#818cf8",
      width: 18,
      height: 18,
    },
  }));
}

/* ── Main Component ── */
export default function FlowView({ data, loading, error, onClose }) {
  const [visible, setVisible] = useState(false);

  const nodeTypes = useMemo(() => ({ functionNode: FunctionNode }), []);

  const initialNodes = useMemo(
    () => (data ? layoutNodes(data.nodes, data.edges) : []),
    [data]
  );
  const initialEdges = useMemo(
    () => (data ? buildEdges(data.edges) : []),
    [data]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when data changes
  useEffect(() => {
    if (data) {
      setNodes(layoutNodes(data.nodes, data.edges));
      setEdges(buildEdges(data.edges));
    }
  }, [data, setNodes, setEdges]);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  return (
    <div
      id="flow-view-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(10,14,26,0.9)",
          backdropFilter: "blur(16px)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, var(--accent-secondary), #a78bfa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(139,92,246,0.35)",
            }}
          >
            <Maximize2 size={14} color="#fff" />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Code Visualization
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "1px",
              }}
            >
              Function relationships &amp; call graph
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Legend */}
          {data && (
            <div
              className="glass-panel"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "6px 14px",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "3px",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  }}
                />
                Nodes: {data.nodes.length}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "2px",
                    background: "#818cf8",
                    borderRadius: "1px",
                  }}
                />
                Edges: {data.edges.length}
              </div>
            </div>
          )}

          {/* Keyboard hint */}
          <span
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-subtle)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ESC
          </span>

          {/* Close button */}
          <button
            id="flow-view-close-btn"
            onClick={handleClose}
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-default)",
              backgroundColor: "rgba(255,255,255,0.04)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.12)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
              e.currentTarget.style.color = "var(--danger-light)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            aria-label="Close visualization"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, position: "relative" }}>
        {/* Loading State */}
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "var(--radius-xl)",
                background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.12))",
                border: "1px solid rgba(139,92,246,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "thinkPulse 2s ease-in-out infinite",
              }}
            >
              <Maximize2 size={22} style={{ color: "var(--accent-secondary)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                Analyzing Code...
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Extracting functions and mapping relationships
              </span>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "var(--accent-secondary)",
                    animation: `dotBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <div
              className="glass-panel"
              style={{
                maxWidth: "420px",
                padding: "24px",
                borderRadius: "var(--radius-xl)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--danger-light)",
                }}
              >
                Visualization Failed
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                }}
              >
                {error}
              </p>
            </div>
          </div>
        )}

        {/* React Flow Canvas */}
        {data && !loading && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2}
            maxZoom={3}
            proOptions={{ hideAttribution: true }}
            style={{ width: "100%", height: "100%" }}
          >
            <Background color="#334155" gap={24} size={1} variant="dots" />
            <Controls />
            <MiniMap
              nodeColor={(n) => n.data?.mapColor || "#6366f1"}
              maskColor="rgba(10,14,26,0.85)"
              style={{
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1px solid var(--glass-border)",
                backgroundColor: "var(--bg-base)",
              }}
            />
          </ReactFlow>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <Maximize2 size={36} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
            <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              No visualization data yet.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
