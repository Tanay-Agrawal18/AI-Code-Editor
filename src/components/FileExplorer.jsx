import { useState, useRef, useEffect, useCallback } from "react";
import {
  FilePlus,
  FolderPlus,
  ChevronLeft,
  ChevronRight,
  Search,
  FolderInput,
  Package,
  X,
  Folder,
} from "lucide-react";
import FileTreeNode from "./FileTreeNode";

export default function FileExplorer({
  fileTree,
  activeFile,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteNode,
  onRenameNode,
  onImportFolder,
  collapsed,
  onToggleCollapse,
  highlightedFiles = new Set(),
}) {
  // Get the root project folder name dynamically
  const rootFolderName = Object.keys(fileTree).find((k) => k !== "__isFolder") || "project";
  const [expandedFolders, setExpandedFolders] = useState(
    new Set([rootFolderName])
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isCreating, setIsCreating] = useState(null); // { type: 'file'|'folder', parentPath: string } | null
  const [newName, setNewName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(rootFolderName); // tracks which folder gets new items
  const inputRef = useRef(null);
  const searchRef = useRef(null);
  const importRef = useRef(null);

  // Auto-expand root folder when project changes
  useEffect(() => {
    setExpandedFolders((prev) => new Set([...prev, rootFolderName]));
    setSelectedFolder(rootFolderName);
  }, [rootFolderName]);

  const toggleFolder = useCallback((path) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Auto-track selected folder from activeFile
  useEffect(() => {
    if (activeFile) {
      const parts = activeFile.split("/");
      // Parent folder is everything except the last segment
      if (parts.length > 1) {
        setSelectedFolder(parts.slice(0, -1).join("/"));
      }
    }
  }, [activeFile]);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showSearch]);

  // ── Determine the target folder for new file/folder ──
  const getTargetFolder = useCallback(() => {
    return selectedFolder || rootFolderName;
  }, [selectedFolder, rootFolderName]);

  const handleCreateSubmit = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setIsCreating(null);
      setNewName("");
      return;
    }

    const parentPath = isCreating?.parentPath || getTargetFolder();

    if (isCreating?.type === "file") {
      onCreateFile(parentPath, trimmed);
      // Auto-expand the parent folder
      setExpandedFolders((prev) => new Set([...prev, parentPath]));
    } else if (isCreating?.type === "folder") {
      onCreateFolder(parentPath, trimmed);
      setExpandedFolders((prev) => new Set([...prev, parentPath]));
    }

    setIsCreating(null);
    setNewName("");
  };

  // ── Start creating in a specific folder (from context menu) ──
  const handleCreateInFolder = useCallback(
    (folderPath) => {
      setSelectedFolder(folderPath);
      setExpandedFolders((prev) => new Set([...prev, folderPath]));
      setIsCreating({ type: "file", parentPath: folderPath });
      setNewName("");
    },
    []
  );

  const handleCreateFolderIn = useCallback(
    (folderPath) => {
      setSelectedFolder(folderPath);
      setExpandedFolders((prev) => new Set([...prev, folderPath]));
      setIsCreating({ type: "folder", parentPath: folderPath });
      setNewName("");
    },
    []
  );

  // ── Select a folder (clicking on a folder in the tree) ──
  const handleFolderSelect = useCallback((path) => {
    setSelectedFolder(path);
  }, []);

  // Flatten file tree for search
  const flattenTree = useCallback((node, path = "", results = []) => {
    Object.entries(node).forEach(([key, val]) => {
      if (key === "__isFolder") return;
      const fullPath = path ? `${path}/${key}` : key;
      if (val.__isFolder) {
        results.push({ name: key, path: fullPath, isFolder: true });
        flattenTree(val, fullPath, results);
      } else {
        results.push({ name: key, path: fullPath, isFolder: false });
      }
    });
    return results;
  }, []);

  const searchResults = searchQuery.trim()
    ? flattenTree(fileTree).filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // ── Folder Import Handler ──
  const handleImportFiles = useCallback(
    async (e) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;

      const importedFiles = {};
      const readers = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const relativePath = file.webkitRelativePath || file.name;

        // Skip hidden files/folders and common non-text files
        if (
          relativePath.includes("/node_modules/") ||
          relativePath.includes("/.git/") ||
          relativePath.includes("/__pycache__/") ||
          relativePath.startsWith(".") ||
          /\.(png|jpg|jpeg|gif|bmp|ico|svg|woff|woff2|ttf|eot|mp3|mp4|avi|mov|zip|tar|gz|exe|dll|so|dylib|pdf|lock)$/i.test(
            file.name
          )
        ) {
          continue;
        }

        // Only import files under a reasonable size (500KB)
        if (file.size > 500 * 1024) continue;

        readers.push(
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const fullPath = `${rootFolderName}/${relativePath}`;
              importedFiles[fullPath] = reader.result;
              resolve();
            };
            reader.onerror = () => resolve(); // skip failed reads
            reader.readAsText(file);
          })
        );
      }

      await Promise.all(readers);

      if (Object.keys(importedFiles).length === 0) {
        return;
      }

      onImportFolder(importedFiles);

      // Auto-expand imported root folder
      const firstPath = Object.keys(importedFiles)[0];
      const rootFolder = firstPath.split("/").slice(0, 2).join("/");
      setExpandedFolders((prev) => new Set([...prev, rootFolderName, rootFolder]));

      // Reset the input so the same folder can be re-imported
      e.target.value = "";
    },
    [onImportFolder]
  );

  // ── Get display label for selected folder ──
  const getSelectedFolderLabel = () => {
    if (!selectedFolder || selectedFolder === rootFolderName) return "root";
    const parts = selectedFolder.split("/");
    return parts[parts.length - 1] + "/";
  };

  // Collapsed sidebar
  if (collapsed) {
    return (
      <div className="file-explorer-collapsed">
        <button
          className="explorer-collapse-btn"
          onClick={onToggleCollapse}
          title="Expand Explorer"
          style={{
            width: "100%",
            padding: "12px 0",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--text-primary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          <ChevronRight size={16} />
        </button>
        <div
          style={{
            width: "100%",
            height: "1px",
            background: "var(--border-subtle)",
          }}
        />
        <button
          onClick={() => {
            onToggleCollapse();
            setTimeout(() => {
              setIsCreating({ type: "file", parentPath: getTargetFolder() });
              setNewName("");
            }, 100);
          }}
          title="New File"
          style={{
            width: "100%",
            padding: "10px 0",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--accent-primary-light)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          <FilePlus size={15} />
        </button>
        <button
          onClick={() => {
            onToggleCollapse();
            setTimeout(() => {
              setIsCreating({ type: "folder", parentPath: getTargetFolder() });
              setNewName("");
            }, 100);
          }}
          title="New Folder"
          style={{
            width: "100%",
            padding: "10px 0",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--accent-primary-light)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          <FolderPlus size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="file-explorer">
      {/* ── Header ── */}
      <div className="file-explorer-header">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Package size={13} style={{ color: "var(--accent-primary-light)" }} />
          <span className="file-explorer-title">EXPLORER</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <ExplorerAction
            icon={Search}
            title="Search Files"
            onClick={() => setShowSearch(!showSearch)}
            active={showSearch}
          />
          <ExplorerAction
            icon={FilePlus}
            title={`New File in ${getSelectedFolderLabel()}`}
            onClick={() => {
              setIsCreating({ type: "file", parentPath: getTargetFolder() });
              setNewName("");
            }}
          />
          <ExplorerAction
            icon={FolderPlus}
            title={`New Folder in ${getSelectedFolderLabel()}`}
            onClick={() => {
              setIsCreating({ type: "folder", parentPath: getTargetFolder() });
              setNewName("");
            }}
          />
          <ExplorerAction
            icon={FolderInput}
            title="Import Folder"
            onClick={() => importRef.current?.click()}
          />
          <ExplorerAction
            icon={ChevronLeft}
            title="Collapse"
            onClick={onToggleCollapse}
          />
        </div>
      </div>

      {/* Hidden folder import input */}
      <input
        ref={importRef}
        type="file"
        webkitdirectory=""
        multiple
        style={{ display: "none" }}
        onChange={handleImportFiles}
      />

      {/* ── Search Bar ── */}
      {showSearch && (
        <div className="file-explorer-search">
          <Search
            size={12}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "12px",
              fontFamily: "'Inter', sans-serif",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      )}

      {/* ── Search Results ── */}
      {showSearch && searchQuery.trim() && (
        <div className="file-explorer-search-results">
          {searchResults.length === 0 ? (
            <div
              style={{
                padding: "12px",
                textAlign: "center",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              No results found
            </div>
          ) : (
            searchResults.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  if (!item.isFolder) {
                    onSelectFile(item.path);
                    setShowSearch(false);
                    setSearchQuery("");
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  width: "100%",
                  padding: "5px 10px",
                  fontSize: "12px",
                  fontFamily: "'Inter', sans-serif",
                  color: "var(--text-secondary)",
                  background:
                    item.path === activeFile
                      ? "rgba(99,102,241,0.1)"
                      : "transparent",
                  border: "none",
                  cursor: item.isFolder ? "default" : "pointer",
                  textAlign: "left",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  if (!item.isFolder)
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!item.isFolder)
                    e.currentTarget.style.background =
                      item.path === activeFile
                        ? "rgba(99,102,241,0.1)"
                        : "transparent";
                }}
              >
                <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                  {item.path}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* ── Inline Create Input ── */}
      {isCreating && (
        <div className="file-explorer-create-input">
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--accent-primary-light)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              New {isCreating.type}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 500,
                color: "var(--text-muted)",
              }}
            >
              in{" "}
              <span style={{ color: "var(--warning)", fontFamily: "'JetBrains Mono', monospace" }}>
                {isCreating.parentPath === rootFolderName
                  ? "/"
                  : isCreating.parentPath.replace(rootFolderName + "/", "") + "/"}
              </span>
            </span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSubmit();
                if (e.key === "Escape") {
                  setIsCreating(null);
                  setNewName("");
                }
              }}
              placeholder={
                isCreating.type === "file" ? "filename.js" : "folder-name"
              }
              style={{
                flex: 1,
                background: "var(--bg-base)",
                border: "1px solid var(--accent-primary)",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "12px",
                fontFamily: "'Inter', sans-serif",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
            <button
              onClick={handleCreateSubmit}
              style={{
                background: "var(--accent-primary)",
                border: "none",
                borderRadius: "4px",
                padding: "4px 8px",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <FilePlus size={12} />
            </button>
            <button
              onClick={() => {
                setIsCreating(null);
                setNewName("");
              }}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "4px",
                padding: "4px 6px",
                color: "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ── File Tree ── */}
      <div className="file-explorer-tree">
        {Object.entries(fileTree)
          .filter(([key]) => key !== "__isFolder")
          .sort(([, a], [, b]) => {
            const aFolder = a.__isFolder ? 0 : 1;
            const bFolder = b.__isFolder ? 0 : 1;
            return aFolder - bFolder;
          })
          .map(([name, node]) => (
            <FileTreeNode
              key={name}
              name={name}
              node={node}
              path={name}
              depth={0}
              activeFile={activeFile}
              selectedFolder={selectedFolder}
              onSelectFile={onSelectFile}
              onFolderSelect={handleFolderSelect}
              onCreateFile={handleCreateInFolder}
              onCreateFolder={handleCreateFolderIn}
              onDelete={onDeleteNode}
              onRename={onRenameNode}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              highlightedFiles={highlightedFiles}
            />
          ))}
      </div>

      {/* ── Footer ── */}
      <div className="file-explorer-footer">
        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
          {countFiles(fileTree)} files
        </span>
      </div>
    </div>
  );
}

// ── Small button for header actions ──
function ExplorerAction({ icon: Icon, title, onClick, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: "24px",
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "rgba(99,102,241,0.15)" : "transparent",
        border: "none",
        borderRadius: "var(--radius-sm)",
        color: active ? "var(--accent-primary-light)" : "var(--text-muted)",
        cursor: "pointer",
        transition: "all 0.12s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        e.currentTarget.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active
          ? "rgba(99,102,241,0.15)"
          : "transparent";
        e.currentTarget.style.color = active
          ? "var(--accent-primary-light)"
          : "var(--text-muted)";
      }}
    >
      <Icon size={14} />
    </button>
  );
}

// ── Count files recursively ──
function countFiles(tree) {
  let count = 0;
  Object.entries(tree).forEach(([key, val]) => {
    if (key === "__isFolder") return;
    if (val.__isFolder) {
      count += countFiles(val);
    } else {
      count++;
    }
  });
  return count;
}
