import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllProjects,
  createProject,
  deleteProject,
  duplicateProject,
  setActiveProjectId,
  getActiveProjectId,
  migrateLegacyData,
} from "../utils/projectManager";
import {
  Plus,
  FolderOpen,
  Trash2,
  Code2,
  Clock,
  FileCode,
  Copy,
  Search,
  Sparkles,
  ArrowRight,
  FolderGit2,
  MoreVertical,
  X,
  Layers,
  Zap,
} from "lucide-react";

// ── Format relative time ──
function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Count files (excluding .gitkeep) ──
function countFiles(files) {
  return Object.keys(files || {}).filter((f) => !f.endsWith(".gitkeep")).length;
}

// ── Get dominant language from file extensions ──
function getLanguageBadge(files) {
  const exts = {};
  Object.keys(files || {}).forEach((f) => {
    const ext = f.split(".").pop()?.toLowerCase();
    if (ext && ext !== "gitkeep") {
      exts[ext] = (exts[ext] || 0) + 1;
    }
  });
  const sorted = Object.entries(exts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  const langMap = {
    js: { name: "JavaScript", color: "#f7df1e" },
    jsx: { name: "React", color: "#61dafb" },
    ts: { name: "TypeScript", color: "#3178c6" },
    tsx: { name: "React TS", color: "#61dafb" },
    py: { name: "Python", color: "#3776ab" },
    css: { name: "CSS", color: "#264de4" },
    html: { name: "HTML", color: "#e34c26" },
    json: { name: "JSON", color: "#5b5ea6" },
    md: { name: "Markdown", color: "#083fa1" },
  };

  return langMap[sorted[0][0]] || { name: sorted[0][0].toUpperCase(), color: "#6366f1" };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [contextMenu, setContextMenu] = useState(null); // { id, x, y }
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const activeProjectId = getActiveProjectId();

  // ── Init: migrate legacy data + load projects ──
  useEffect(() => {
    migrateLegacyData();
    setProjects(getAllProjects());
  }, []);

  // ── Close context menu on outside click ──
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [contextMenu]);

  // ── Filtered projects ──
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Create project ──
  const handleCreate = useCallback(() => {
    const name = newProjectName.trim();
    if (!name) return;

    // Check for duplicate names
    if (projects.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return;
    }

    const project = createProject(name);
    setActiveProjectId(project.id);
    setProjects(getAllProjects());
    setShowNewModal(false);
    setNewProjectName("");
    navigate("/editor");
  }, [newProjectName, projects, navigate]);

  // ── Open project ──
  const handleOpen = useCallback(
    (id) => {
      setActiveProjectId(id);
      navigate("/editor");
    },
    [navigate]
  );

  // ── Delete project ──
  const handleDelete = useCallback(
    (id) => {
      deleteProject(id);
      setProjects(getAllProjects());
      setDeleteConfirm(null);
      setContextMenu(null);
    },
    []
  );

  // ── Duplicate project ──
  const handleDuplicate = useCallback((id) => {
    duplicateProject(id);
    setProjects(getAllProjects());
    setContextMenu(null);
  }, []);

  // ── Keyboard: Enter to create ──
  const handleCreateKeyDown = (e) => {
    if (e.key === "Enter") handleCreate();
    if (e.key === "Escape") {
      setShowNewModal(false);
      setNewProjectName("");
    }
  };

  return (
    <div className="dashboard-root">
      {/* ── Ambient background effects ── */}
      <div className="dashboard-bg-glow dashboard-bg-glow-1" />
      <div className="dashboard-bg-glow dashboard-bg-glow-2" />
      <div className="dashboard-bg-grid" />

      <div className="dashboard-container">
        {/* ── Header ── */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Your Projects</h1>
            <p className="dashboard-subtitle">
              Manage and continue your work
            </p>
          </div>

          <button
            className="dashboard-new-btn"
            onClick={() => setShowNewModal(true)}
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>
        </header>

        <div className="dashboard-search-row">
          <div className="dashboard-search-group">

            <div className="dashboard-search">
              <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="dashboard-search-input"
              />
              {search && (
                <button
                  className="dashboard-search-clear"
                  onClick={() => setSearch("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {projects.length > 0 && (
              <div className="dashboard-project-count">
                <Layers size={12} />
                <span>
                  {filteredProjects.length} of {projects.length} project
                  {projects.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}

          </div>
        </div>

        {/* ── Project Grid ── */}
        <div className="dashboard-grid-area">
          {filteredProjects.length === 0 && search ? (
            <div className="dashboard-empty">
              <Search size={40} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
              <h3>No projects found</h3>
              <p>No projects match "{search}"</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">
                <FolderGit2 size={44} />
              </div>
              <h3>No projects yet</h3>
              <p>Create your first project to get started with the AI-powered editor.</p>
              <button
                className="dashboard-new-btn"
                onClick={() => setShowNewModal(true)}
                style={{ marginTop: 20 }}
              >
                <Zap size={15} />
                <span>Create your first project</span>
              </button>
            </div>
          ) : (
            <div className="dashboard-grid">
              {filteredProjects.map((project, i) => {
                const lang = getLanguageBadge(project.files);
                const isActive = project.id === activeProjectId;
                const fileCount = countFiles(project.files);

                return (
                  <div
                    key={project.id}
                    className={`dashboard-card${isActive ? " dashboard-card-active" : ""}`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    {/* Card header */}
                    <div className="dashboard-card-header">
                      <div className="dashboard-card-icon">
                        <FolderOpen size={18} />
                      </div>
                      <div className="dashboard-card-info">
                        <h3 className="dashboard-card-name">{project.name}</h3>
                        <div className="dashboard-card-meta">
                          <span className="dashboard-card-stat">
                            <FileCode size={11} />
                            {fileCount} file{fileCount !== 1 ? "s" : ""}
                          </span>
                          <span className="dashboard-card-divider-dot">·</span>
                          <span className="dashboard-card-time">
                            <Clock size={10} />
                            {timeAgo(project.lastModified)}
                          </span>
                        </div>
                      </div>
                      <button
                        className="dashboard-card-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenu(
                            contextMenu?.id === project.id
                              ? null
                              : { id: project.id }
                          );
                        }}
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>

                    {/* Card badges */}
                    <div className="dashboard-card-badges">
                      {lang && (
                        <span
                          className="dashboard-card-lang"
                          style={{
                            borderColor: `${lang.color}33`,
                            color: lang.color,
                            background: `${lang.color}10`,
                          }}
                        >
                          {lang.name}
                        </span>
                      )}
                      {isActive && (
                        <span className="dashboard-card-active-badge">
                          <Sparkles size={9} />
                          Active
                        </span>
                      )}
                    </div>

                    {/* Hover overlay with actions */}
                    <div className="dashboard-card-overlay">
                      <button
                        className="dashboard-card-overlay-btn dashboard-card-overlay-primary"
                        onClick={() => handleOpen(project.id)}
                      >
                        <FolderOpen size={15} />
                        Open
                      </button>
                      <div className="dashboard-card-overlay-secondary">
                        <button
                          className="dashboard-card-overlay-btn-sm"
                          onClick={() => handleDuplicate(project.id)}
                          title="Duplicate"
                        >
                          <Copy size={13} />
                          Duplicate
                        </button>
                        <button
                          className="dashboard-card-overlay-btn-sm dashboard-card-overlay-danger"
                          onClick={() => {
                            setDeleteConfirm(project.id);
                            setContextMenu(null);
                          }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Card bottom action */}
                    <button
                      className="dashboard-card-open-btn"
                      onClick={() => handleOpen(project.id)}
                    >
                      <span>Open in Editor</span>
                      <ArrowRight size={14} />
                    </button>

                    {/* Context menu */}
                    {contextMenu?.id === project.id && (
                      <div
                        className="dashboard-context-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="dashboard-context-item"
                          onClick={() => handleOpen(project.id)}
                        >
                          <FolderOpen size={13} />
                          Open
                        </button>
                        <button
                          className="dashboard-context-item"
                          onClick={() => handleDuplicate(project.id)}
                        >
                          <Copy size={13} />
                          Duplicate
                        </button>
                        <div className="dashboard-context-divider" />
                        <button
                          className="dashboard-context-item dashboard-context-danger"
                          onClick={() => {
                            setDeleteConfirm(project.id);
                            setContextMenu(null);
                          }}
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── New Project Modal ── */}
      {showNewModal && (
        <div
          className="dashboard-modal-overlay"
          onClick={() => {
            setShowNewModal(false);
            setNewProjectName("");
          }}
        >
          <div
            className="dashboard-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header">
              <div className="dashboard-modal-icon">
                <Plus size={18} />
              </div>
              <div>
                <h2 className="dashboard-modal-title">Create New Project</h2>
                <p className="dashboard-modal-subtitle">
                  Start a fresh workspace with boilerplate files
                </p>
              </div>
            </div>

            <div className="dashboard-modal-body">
              <label className="dashboard-modal-label">Project Name</label>
              <input
                type="text"
                placeholder="my-awesome-project"
                value={newProjectName}
                onChange={(e) =>
                  setNewProjectName(
                    e.target.value.replace(/[^a-zA-Z0-9_\-. ]/g, "")
                  )
                }
                onKeyDown={handleCreateKeyDown}
                className="dashboard-modal-input"
                autoFocus
                maxLength={40}
              />
              {newProjectName &&
                projects.some(
                  (p) =>
                    p.name.toLowerCase() ===
                    newProjectName.trim().toLowerCase()
                ) && (
                  <p className="dashboard-modal-error">
                    A project with this name already exists
                  </p>
                )}
            </div>

            <div className="dashboard-modal-actions">
              <button
                className="dashboard-modal-cancel"
                onClick={() => {
                  setShowNewModal(false);
                  setNewProjectName("");
                }}
              >
                Cancel
              </button>
              <button
                className="dashboard-modal-create"
                onClick={handleCreate}
                disabled={
                  !newProjectName.trim() ||
                  projects.some(
                    (p) =>
                      p.name.toLowerCase() ===
                      newProjectName.trim().toLowerCase()
                  )
                }
              >
                <Plus size={14} />
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div
          className="dashboard-modal-overlay"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="dashboard-modal dashboard-modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header">
              <div
                className="dashboard-modal-icon"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.25))",
                  color: "var(--danger-light)",
                  boxShadow: "0 4px 18px rgba(239,68,68,0.15)",
                }}
              >
                <Trash2 size={18} />
              </div>
              <div>
                <h2 className="dashboard-modal-title">Delete Project?</h2>
                <p className="dashboard-modal-subtitle">
                  This action cannot be undone. All files will be lost.
                </p>
              </div>
            </div>

            <div className="dashboard-modal-actions">
              <button
                className="dashboard-modal-cancel"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="dashboard-modal-delete"
                onClick={() => handleDelete(deleteConfirm)}
              >
                <Trash2 size={14} />
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
