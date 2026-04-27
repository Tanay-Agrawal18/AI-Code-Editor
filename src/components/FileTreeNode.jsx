import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Pencil,
  Trash2,
  FilePlus,
  FolderPlus,
  Check,
  X,
} from "lucide-react";

// ── Helpers ──
const getFileIcon = (name) => {
  const ext = name.split(".").pop().toLowerCase();
  const iconMap = {
    js: { color: "#f7df1e", label: "JS" },
    jsx: { color: "#61dafb", label: "JSX" },
    ts: { color: "#3178c6", label: "TS" },
    tsx: { color: "#3178c6", label: "TSX" },
    py: { color: "#3776ab", label: "PY" },
    html: { color: "#e34f26", label: "HTML" },
    css: { color: "#1572b6", label: "CSS" },
    json: { color: "#292929", label: "JSON" },
    md: { color: "#083fa1", label: "MD" },
  };
  return iconMap[ext] || null;
};

export default function FileTreeNode({
  name,
  node,
  path,
  depth = 0,
  activeFile,
  selectedFolder,
  onSelectFile,
  onFolderSelect,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onRename,
  expandedFolders,
  toggleFolder,
  highlightedFiles = new Set(),
}) {
  const isFolder = node.__isFolder;
  const isActive = !isFolder && path === activeFile;
  const isSelectedFolder = isFolder && selectedFolder === path;
  const isExpanded = expandedFolders.has(path);
  const isHighlighted = highlightedFiles.has(path);

  // Rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(name);
  const renameRef = useRef(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    if (isRenaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [isRenaming]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [contextMenu]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const submitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== name) {
      onRename(path, trimmed);
    }
    setIsRenaming(false);
  };

  const fileIcon = !isFolder ? getFileIcon(name) : null;

  // Get sorted children for folders
  const children = isFolder
    ? Object.entries(node)
        .filter(([key]) => key !== "__isFolder")
        .sort(([, a], [, b]) => {
          const aFolder = a.__isFolder ? 0 : 1;
          const bFolder = b.__isFolder ? 0 : 1;
          return aFolder - bFolder;
        })
    : [];

  return (
    <div style={{ userSelect: "none" }}>
      {/* ── Node Row ── */}
      <div
        className="file-tree-node"
        onClick={() => {
          if (isRenaming) return;
          if (isFolder) {
            toggleFolder(path);
            if (onFolderSelect) onFolderSelect(path);
          } else {
            onSelectFile(path);
          }
        }}
        onContextMenu={handleContextMenu}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 8px",
          paddingLeft: `${8 + depth * 16}px`,
          cursor: "pointer",
          fontSize: "12.5px",
          fontWeight: isActive ? 600 : 400,
          fontFamily: "'Inter', sans-serif",
          color: isHighlighted
            ? "#fbbf24"
            : isActive
            ? "var(--accent-primary-light)"
            : isSelectedFolder
            ? "var(--text-primary)"
            : "var(--text-secondary)",
          background: isHighlighted
            ? "rgba(251,191,36,0.1)"
            : isActive
            ? "linear-gradient(90deg, rgba(99,102,241,0.12), rgba(99,102,241,0.04))"
            : isSelectedFolder
            ? "rgba(250,204,21,0.06)"
            : "transparent",
          borderLeft: isHighlighted
            ? "2px solid #fbbf24"
            : isActive
            ? "2px solid var(--accent-primary)"
            : isSelectedFolder
            ? "2px solid rgba(250,204,21,0.4)"
            : "2px solid transparent",
          transition: "all 0.15s ease",
          position: "relative",
          minHeight: "28px",
          animation: isHighlighted ? "undoHighlightPulse 1.5s ease-in-out" : "none",
          boxShadow: isHighlighted ? "inset 0 0 16px rgba(251,191,36,0.08)" : "none",
        }}
      >
        {/* Expand/Collapse or File icon */}
        {isFolder ? (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              color: "var(--text-muted)",
              transition: "transform 0.15s ease",
            }}
          >
            {isExpanded ? (
              <ChevronDown size={13} />
            ) : (
              <ChevronRight size={13} />
            )}
          </span>
        ) : (
          <span style={{ width: "13px" }} />
        )}

        {/* Icon */}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen
              size={14}
              style={{ color: "#facc15", flexShrink: 0 }}
            />
          ) : (
            <Folder size={14} style={{ color: "#facc15", flexShrink: 0 }} />
          )
        ) : fileIcon ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "14px",
              height: "14px",
              borderRadius: "2px",
              background: fileIcon.color + "22",
              flexShrink: 0,
            }}
          >
            <File size={10} style={{ color: fileIcon.color }} />
          </span>
        ) : (
          <File
            size={14}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
        )}

        {/* Name or Rename input */}
        {isRenaming ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              flex: 1,
              minWidth: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={renameRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
                if (e.key === "Escape") setIsRenaming(false);
              }}
              onBlur={submitRename}
              style={{
                flex: 1,
                minWidth: 0,
                background: "var(--bg-surface)",
                border: "1px solid var(--accent-primary)",
                borderRadius: "3px",
                padding: "1px 5px",
                fontSize: "12px",
                fontFamily: "'Inter', sans-serif",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          </div>
        ) : (
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            {name}
          </span>
        )}
      </div>

      {/* ── Context Menu ── */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 9999,
            background: "var(--bg-raised)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-md)",
            padding: "4px 0",
            minWidth: "160px",
            boxShadow: "var(--shadow-lg)",
            animation: "scaleIn 0.12s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {isFolder && (
            <>
              <ContextMenuItem
                icon={FilePlus}
                label="New File"
                onClick={() => {
                  setContextMenu(null);
                  onCreateFile(path);
                }}
              />
              <ContextMenuItem
                icon={FolderPlus}
                label="New Folder"
                onClick={() => {
                  setContextMenu(null);
                  onCreateFolder(path);
                }}
              />
              <div
                style={{
                  height: "1px",
                  background: "var(--border-default)",
                  margin: "4px 8px",
                }}
              />
            </>
          )}
          <ContextMenuItem
            icon={Pencil}
            label="Rename"
            onClick={() => {
              setContextMenu(null);
              setRenameValue(name);
              setIsRenaming(true);
            }}
          />
          <ContextMenuItem
            icon={Trash2}
            label="Delete"
            danger
            onClick={() => {
              setContextMenu(null);
              onDelete(path);
            }}
          />
        </div>
      )}

      {/* ── Children (for folders) ── */}
      {isFolder && isExpanded && (
        <div
          style={{
            overflow: "hidden",
            animation: "folderExpand 0.2s ease-out",
          }}
        >
        {children.map(([childName, childNode]) => (
            <FileTreeNode
              key={childName}
              name={childName}
              node={childNode}
              path={`${path}/${childName}`}
              depth={depth + 1}
              activeFile={activeFile}
              selectedFolder={selectedFolder}
              onSelectFile={onSelectFile}
              onFolderSelect={onFolderSelect}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onDelete={onDelete}
              onRename={onRename}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              highlightedFiles={highlightedFiles}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Context Menu Item ──
function ContextMenuItem({ icon: Icon, label, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        padding: "6px 12px",
        fontSize: "12px",
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
        color: danger ? "var(--danger-light)" : "var(--text-secondary)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.12s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? "rgba(239,68,68,0.1)"
          : "rgba(255,255,255,0.05)";
        e.currentTarget.style.color = danger
          ? "var(--danger-light)"
          : "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = danger
          ? "var(--danger-light)"
          : "var(--text-secondary)";
      }}
    >
      <Icon size={13} />
      <span>{label}</span>
    </button>
  );
}
