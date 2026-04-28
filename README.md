# 🚀 AI Code Editor — Autonomous Agentic IDE

A next-generation **AI-powered code editor** that transforms natural language into complete, structured codebases using an autonomous agent pipeline.

Built to replicate and extend the capabilities of tools like Cursor and Antigravity.

---

## 🧠 Core Idea

This editor doesn’t just generate code — it **plans, executes, reviews, and fixes** it.

```text
Prompt → Plan → Execute → Review → Diff → Apply → Undo → Self-Correct
```

---

## ✨ Key Features

### 🤖 Autonomous AI Agent

* Step-by-step execution engine
* Multi-file create/update/delete actions
* Self-correction pass (auto-fixes errors)
* Confidence scoring system

---

### 🛡️ Safe AI Workflow

* 🔍 Action Preview before applying changes
* 🆚 Side-by-side Diff Viewer (Monaco)
* 🔄 Undo / Redo system with history
* 🧠 Self-review before execution

---

### 💬 AI Chat Control Panel

* Natural language → full project changes
* Plan checklist with execution states
* Multi-step agent visualization
* Context-aware (entire codebase aware)

---

### ⚡ Developer Experience

* Monaco Editor with inline AI autocomplete
* Auto-formatting (Prettier integration)
* Multi-file editing system
* File Explorer with nested structure

---

### 📁 Project System

* Multi-project dashboard
* Auto-save (localStorage)
* Import from GitHub
* Export as ZIP

---

### 📊 Visualization

* Code flow graph (React Flow)
* Function relationship mapping

---

## 🏗️ Architecture

### Frontend (React + Vite)

* IDE interface + state management
* Multi-project system
* AI interaction layer

### Backend (Node + Express)

* AI orchestration layer
* Groq API integration
* GitHub + project generation APIs

---

## 🤖 AI Pipeline

1. **Planning**

   * Breaks prompt into structured steps

2. **Execution**

   * Generates file-level actions

3. **Self-Correction**

   * Fixes syntax & logic issues

4. **User Control**

   * Preview → Diff → Apply

---

## 🛠️ Tech Stack

**Frontend**

* React 18 + Vite
* Monaco Editor
* Framer Motion
* Custom CSS (Glassmorphism UI)

**Backend**

* Node.js + Express
* Groq API (LLMs)
* GitHub REST API

---

## 🚀 Getting Started

```bash
git clone https://github.com/Tanay-Agrawal18/AI-Code-Editor.git
cd AI-Code-Editor
```

```bash
# Frontend
npm install
npm run dev
```

```bash
# Backend
cd backend
npm install
node server.js
```

---

## 🔐 Environment Variables

```env
GROQ_API_KEY=your_api_key_here
```

---

## 🎯 What Makes This Unique?

* Not just AI suggestions — **AI executes workflows**
* Full **agent-based architecture**
* Built-in **safety system (diff + undo + preview)**
* Designed like a **real developer tool, not a demo**

---

## 👨‍💻 Author

**Tanay Agrawal**

---

⭐ If you like this project, consider starring the repo!
