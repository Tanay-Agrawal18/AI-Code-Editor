// ══════════════════════════════════════════════════
//  PROJECT MANAGER — Multi-Project localStorage CRUD
// ══════════════════════════════════════════════════

const STORAGE_KEY = "ide_projects";
const ACTIVE_KEY = "ide_activeProjectId";

// Legacy keys (from the old single-project system)
const LEGACY_FILES = "ide_files";
const LEGACY_ACTIVE = "ide_activeFile";
const LEGACY_TABS = "ide_openTabs";

// ── Helpers ──

function generateId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable
  }
}

// ── Default file contents for new projects ──

const DEFAULT_FILES = {
  "src/index.js": `// Welcome to your new project ✨
// Start coding here!

function main() {
  console.log("Hello, World!");
}

main();
`,
  "src/styles.css": `/* Project Styles */
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
`,
  "README.md": `# New Project

Created with AI Code Editor ✨
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
        current[part] = files[filePath];
      } else {
        if (!current[part] || !current[part].__isFolder) {
          current[part] = { __isFolder: true };
        }
        current = current[part];
      }
    });
  });

  return tree;
}

// ══════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════

/** Get all projects (sorted by lastModified descending) */
export function getAllProjects() {
  const projects = loadJSON(STORAGE_KEY, []);
  return projects.sort(
    (a, b) => new Date(b.lastModified) - new Date(a.lastModified)
  );
}

/** Get the active project ID */
export function getActiveProjectId() {
  return loadJSON(ACTIVE_KEY, null);
}

/** Set the active project ID */
export function setActiveProjectId(id) {
  saveJSON(ACTIVE_KEY, id);
}

/** Get a single project by ID */
export function getProject(id) {
  const projects = loadJSON(STORAGE_KEY, []);
  return projects.find((p) => p.id === id) || null;
}

/** Create a new project and return it */
export function createProject(name) {
  const projects = loadJSON(STORAGE_KEY, []);
  const now = new Date().toISOString();

  const prefixedFiles = {};
  Object.entries(DEFAULT_FILES).forEach(([path, content]) => {
    prefixedFiles[`${name}/${path}`] = content;
  });

  const project = {
    id: generateId(),
    name: name.trim(),
    files: prefixedFiles,
    fileTree: buildFileTree(prefixedFiles),
    activeFile: `${name}/src/index.js`,
    openTabs: [`${name}/src/index.js`],
    createdAt: now,
    lastModified: now,
  };

  projects.push(project);
  saveJSON(STORAGE_KEY, projects);
  return project;
}

/** Update a project's files and related editor state */
export function updateProject(id, updates) {
  const projects = loadJSON(STORAGE_KEY, []);
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const project = projects[idx];
  const merged = {
    ...project,
    ...updates,
    lastModified: new Date().toISOString(),
  };

  // Rebuild fileTree if files changed
  if (updates.files) {
    merged.fileTree = buildFileTree(updates.files);
  }

  projects[idx] = merged;
  saveJSON(STORAGE_KEY, projects);
  return merged;
}

/** Delete a project by ID */
export function deleteProject(id) {
  let projects = loadJSON(STORAGE_KEY, []);
  projects = projects.filter((p) => p.id !== id);
  saveJSON(STORAGE_KEY, projects);

  // If we just deleted the active project, clear it
  const activeId = getActiveProjectId();
  if (activeId === id) {
    saveJSON(ACTIVE_KEY, null);
  }
}

/** Rename a project */
export function renameProject(id, newName) {
  return updateProject(id, { name: newName.trim() });
}

/**
 * Migrate legacy single-project localStorage data into the
 * new multi-project system (runs once automatically).
 */
export function migrateLegacyData() {
  const projects = loadJSON(STORAGE_KEY, null);

  // Already migrated or fresh install
  if (projects !== null) return;

  const legacyFiles = loadJSON(LEGACY_FILES, null);
  if (!legacyFiles || Object.keys(legacyFiles).length === 0) {
    // Nothing to migrate — initialise empty
    saveJSON(STORAGE_KEY, []);
    return;
  }

  const legacyActive = loadJSON(LEGACY_ACTIVE, null);
  const legacyTabs = loadJSON(LEGACY_TABS, []);
  const now = new Date().toISOString();

  // Derive project name from root folder
  const firstPath = Object.keys(legacyFiles)[0] || "";
  const rootFolder = firstPath.split("/")[0] || "my-project";

  const migratedProject = {
    id: generateId(),
    name: rootFolder,
    files: legacyFiles,
    fileTree: buildFileTree(legacyFiles),
    activeFile: legacyActive || Object.keys(legacyFiles)[0],
    openTabs:
      legacyTabs.length > 0
        ? legacyTabs.filter((t) => legacyFiles.hasOwnProperty(t))
        : [Object.keys(legacyFiles)[0]],
    createdAt: now,
    lastModified: now,
  };

  saveJSON(STORAGE_KEY, [migratedProject]);
  setActiveProjectId(migratedProject.id);

  // Clean up legacy keys
  try {
    localStorage.removeItem(LEGACY_FILES);
    localStorage.removeItem(LEGACY_ACTIVE);
    localStorage.removeItem(LEGACY_TABS);
  } catch {
    // ignore
  }
}

/** Get total count of projects */
export function getProjectCount() {
  return loadJSON(STORAGE_KEY, []).length;
}

/** Duplicate a project */
export function duplicateProject(id) {
  const source = getProject(id);
  if (!source) return null;

  const projects = loadJSON(STORAGE_KEY, []);
  const now = new Date().toISOString();

  const newProject = {
    ...source,
    id: generateId(),
    name: `${source.name}-copy`,
    createdAt: now,
    lastModified: now,
  };

  projects.push(newProject);
  saveJSON(STORAGE_KEY, projects);
  return newProject;
}
