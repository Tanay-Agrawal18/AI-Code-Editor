# 🚀 AI Code Editor — Autonomous Agentic IDE

A next-generation **AI-powered code editor** that transforms natural language into complete, structured codebases using an autonomous agent pipeline.

Built to replicate and extend the capabilities of tools like Cursor and Antigravity.

---

## 🧠 Core Idea

This editor doesn't just generate code — it **plans, executes, reviews, and fixes** it.

```text
Prompt → Plan → Execute → Review → Diff → Apply → Undo → Self-Correct
```

---

## ✨ Key Features

### 🤖 Autonomous AI Agent

- Step-by-step execution engine with live progress
- Multi-file create / update / delete actions
- Self-correction pass (auto-fixes errors)
- Confidence scoring system (High / Medium / Low)

### 🛡️ Safe AI Workflow

- 🔍 Action Preview before applying changes
- 🆚 Side-by-side Diff Viewer (Monaco)
- 🔄 Undo / Redo system with full history
- 🧠 Self-review before execution

### 💬 AI Chat Control Panel

- Natural language → full project changes
- Plan checklist with execution states
- Multi-step agent visualization
- Context-aware (entire codebase awareness)

### ⚡ Developer Experience

- Monaco Editor with inline AI autocomplete
- Auto-formatting (Prettier integration)
- Multi-file editing with tabbed interface
- File Explorer with nested folder structure
- Floating toolbar for quick AI actions

### 📁 Project System

- Multi-project dashboard
- Auto-save (localStorage persistence)
- Import from GitHub repositories
- Export as ZIP archive
- Folder import from local filesystem

### 📊 Visualization

- Interactive code flow graph (React Flow)
- Function relationship mapping
- Fullscreen graph view with zoom/pan

---

## 🏗️ Architecture

### Frontend (React + Vite)

- IDE interface with Monaco Editor
- Multi-project state management
- AI interaction layer with toast notifications
- Lazy-loaded components for performance

### Backend (Node.js + Express)

- AI orchestration layer with self-review pipeline
- Groq API integration (LLaMA models)
- GitHub REST API integration
- ZIP export with Archiver
- Standardized API responses (`{ success, data/error }`)

---

## 🤖 AI Pipeline

1. **Planning** — Breaks prompt into structured steps
2. **Execution** — Generates file-level actions per step
3. **Self-Correction** — Reviews output for syntax, imports, and logic issues
4. **User Control** — Preview → Diff → Apply / Discard

---

## 🛠️ Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React 18, Vite, Monaco Editor       |
| Styling  | Custom CSS (Glassmorphism + Design Tokens) |
| Backend  | Node.js, Express                    |
| AI       | Groq API (LLaMA 3.3 70B / 3.1 8B)  |
| Flow     | React Flow (visualization)          |
| Lint     | ESLint + Prettier                   |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A [Groq API key](https://console.groq.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/Tanay-Agrawal18/AI-Code-Editor.git
cd AI-Code-Editor
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_CHAT_MODEL=llama-3.1-8b-instant
```

Start the backend:

```bash
node server.js
```

### 3. Setup Frontend

```bash
# From the project root
npm install
```

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev
```

### 4. Open in Browser

Visit [http://localhost:5173](http://localhost:5173)

---

## ⌨️ Keyboard Shortcuts

| Shortcut             | Action                    |
| -------------------- | ------------------------- |
| `Ctrl + S`           | Format document           |
| `Ctrl + Shift + E`   | Explain code              |
| `Ctrl + Shift + A`   | Apply AI intent           |
| `Ctrl + Shift + V`   | Visualize functions       |
| `Ctrl + B`           | Toggle right panel        |
| `Ctrl + \`           | Toggle file explorer      |
| `Ctrl + Shift + G`   | AI Project Generator      |
| `Ctrl + Shift + C`   | AI Chat Panel             |
| `Ctrl + Shift + Z`   | Undo AI changes           |
| `Ctrl + Shift + Y`   | Redo AI changes           |

---

## 📦 Production Build

```bash
npm run build
```

The production bundle will be output to `dist/`.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable          | Description                        | Default                     |
| ----------------- | ---------------------------------- | --------------------------- |
| `GROQ_API_KEY`    | Groq API key (required)            | —                           |
| `PORT`            | Server port                        | `5000`                      |
| `GROQ_MODEL`      | Primary AI model                   | `llama-3.3-70b-versatile`   |
| `GROQ_CHAT_MODEL` | Chat/agent model                   | `llama-3.1-8b-instant`      |

### Frontend (`.env`)

| Variable        | Description           | Default                  |
| --------------- | --------------------- | ------------------------ |
| `VITE_API_URL`  | Backend API URL       | `http://localhost:5000`  |

---

## 🎯 What Makes This Unique?

- Not just AI suggestions — **AI executes workflows autonomously**
- Full **agent-based architecture** with planning + execution steps
- Built-in **safety system** (diff viewer + undo/redo + preview modal)
- **Self-correction pipeline** — AI reviews and fixes its own output
- Designed like a **real developer tool, not a demo**

---

## 👨‍💻 Author

**Tanay Agrawal**

---

⭐ If you like this project, consider starring the repo!
