const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const archiver = require("archiver");
const { parseCodeFallback } = require("./utils/parser");
const { fetchGitHubTree } = require("./utils/github");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5000;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant";

// ── Initialize Groq Client ──
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Middleware ──
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ai-code-editor-ruby-six.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));

// ── Helper: Call Groq Chat Completions ──
async function callGroq(systemPrompt, userPrompt, jsonMode = false) {
  const params = {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 8192,
  };

  if (jsonMode) {
    params.response_format = { type: "json_object" };
  }

  const completion = await groq.chat.completions.create(params);
  return completion.choices[0]?.message?.content || "";
}

// ── Health Check ──
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", provider: "Groq", model: GROQ_MODEL });
});

// ── POST /api/explain ──
app.post("/api/explain", async (req, res) => {
  const { code } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: "No code provided." });
  }

  try {
    const explanation = await callGroq(
      "You are a helpful programming tutor. Explain code in simple terms, step by step, for a beginner. Mention what each function does and how the flow works. Use clear formatting with bullet points and headings.",
      `Explain the following code:\n\n\`\`\`\n${code}\n\`\`\``
    );

    if (!explanation) {
      return res.status(502).json({ error: "Empty response from Groq API." });
    }

    return res.json({ explanation });
  } catch (err) {
    return res.status(500).json({
      error: `Failed to get explanation: ${err.message}`,
    });
  }
});

// ── POST /api/intent ──
const INTENT_PROMPTS = {
  optimize:
    "You are a code optimization expert. Rewrite the user's code to make it more efficient and faster. Return ONLY the final improved code. Do NOT add comments. Do NOT explain anything. Do NOT add extra text. Only output pure code.",
  debug:
    "You are a debugging expert. Find and fix all bugs in the user's code. Return ONLY the final corrected code. Do NOT add comments. Do NOT explain anything. Do NOT add extra text. Only output pure code.",
  clean:
    "You are a code quality expert. Rewrite the user's code to make it clean, readable, and well-structured. Return ONLY the final improved code. Do NOT add comments. Do NOT explain anything. Do NOT add extra text. Only output pure code.",
};

app.post("/api/intent", async (req, res) => {
  const { code, intent } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: "No code provided." });
  }

  if (!intent || !INTENT_PROMPTS[intent]) {
    return res
      .status(400)
      .json({ error: `Invalid intent. Use one of: ${Object.keys(INTENT_PROMPTS).join(", ")}` });
  }

  try {
    const result = await callGroq(
      INTENT_PROMPTS[intent],
      `Here is the code:\n\n\`\`\`\n${code}\n\`\`\``
    );

    if (!result) {
      return res.status(502).json({ error: "Empty response from Groq API." });
    }

    // Strip markdown code fences if present
    const cleaned = result
      .replace(/^```[\w]*\n?/gm, "")
      .replace(/```\s*$/gm, "")
      .trim();

    return res.json({ result: cleaned });
  } catch (err) {
    return res.status(500).json({
      error: `Failed to apply intent: ${err.message}`,
    });
  }
});

// ── POST /api/visualize ──

app.post("/api/visualize", async (req, res) => {
  const { code } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: "No code provided." });
  }

  // Primary: Use the deterministic regex parser (fast & reliable)
  const parsed = parseCodeFallback(code);

  if (parsed.nodes.length > 0) {
    return res.json(parsed);
  }

  // Secondary: Try Groq if regex found nothing
  try {
    const raw = await callGroq(
      `You are a code analyzer. Analyze code and identify all functions/methods and their call relationships. Return ONLY a JSON object in this exact format:
{"nodes":["functionName1","functionName2"],"edges":[{"from":"caller","to":"callee"}]}

Rules:
- "nodes" must contain ONLY function names found in the provided code
- "edges" must show which function calls which other function
- Do NOT invent function names
- If no functions exist, return {"nodes":[],"edges":[]}`,
      `Analyze this code:\n\n\`\`\`\n${code}\n\`\`\``,
      true // JSON mode
    );

    if (!raw) {
      return res.status(200).json({
        nodes: [],
        edges: [],
        warning: "No functions detected in the code.",
      });
    }

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");

      const result = JSON.parse(jsonMatch[0]);

      const nodes = Array.isArray(result.nodes) ? result.nodes.filter(n => typeof n === "string") : [];
      const rawEdges = Array.isArray(result.edges) ? result.edges : [];
      const edges = rawEdges
        .filter(e => e && (e.from || e.source) && (e.to || e.target))
        .map(e => ({
          from: e.from || e.source,
          to: e.to || e.target,
        }))
        .filter(e => nodes.includes(e.from) && nodes.includes(e.to));

      return res.json({ nodes, edges });
    } catch (parseErr) {
      return res.status(200).json({
        nodes: [],
        edges: [],
        warning: "No functions detected in the code.",
      });
    }
  } catch (err) {
    return res.status(200).json({
      nodes: [],
      edges: [],
      warning: "No functions detected in the code. Try adding function definitions.",
    });
  }
});

// ── POST /api/generate-project ──
app.post("/api/generate-project", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: "No prompt provided." });
  }

  try {
    const systemPrompt = `You are an AI project generator.
Return ONLY valid JSON in this exact format:

{
  "projectName": "short-kebab-case-name",
  "files": [
    {
      "path": "src/App.js",
      "content": "// code here"
    },
    {
      "path": "src/styles.css",
      "content": "/* css here */"
    }
  ]
}

Rules:
- "projectName" must be a short, descriptive kebab-case name for the project (e.g., "todo-app", "weather-dashboard", "auth-system")
- Generate complete, working code for each file
- Use realistic, well-structured file paths (e.g., src/components/Header.jsx, src/utils/helpers.js)
- Include all necessary files for the project to work (HTML, CSS, JS, config files, etc.)
- Code should be production-quality, well-formatted, and follow best practices
- Do NOT add any explanations, comments outside code, or markdown formatting
- Do not explain anything. Return ONLY the JSON object, nothing else`;

    const raw = await callGroq(systemPrompt, prompt, true);

    if (!raw) {
      return res.status(502).json({ error: "Empty response from Groq API." });
    }

    // Parse the JSON response
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");

      const result = JSON.parse(jsonMatch[0]);

      if (!result.files || !Array.isArray(result.files) || result.files.length === 0) {
        return res.status(502).json({ error: "AI returned no files. Try a more detailed prompt." });
      }

      // Extract or generate project name
      let projectName = result.projectName;
      if (!projectName || typeof projectName !== "string") {
        // Fallback: generate from prompt
        projectName = prompt
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 30)
          .replace(/-+$/, "") || "generated-project";
      }

      // Sanitize project name
      projectName = projectName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "generated-project";

      // Validate each file has path and content
      const validFiles = result.files
        .filter((f) => f && typeof f.path === "string" && typeof f.content === "string")
        .map((f) => ({
          path: f.path.replace(/^\/+/, ""), // Remove leading slashes
          content: f.content,
        }));

      if (validFiles.length === 0) {
        return res.status(502).json({ error: "AI returned invalid file format." });
      }

      return res.json({ projectName, files: validFiles });
    } catch (parseErr) {
      return res.status(502).json({
        error: "Failed to parse AI response. Try simplifying your prompt.",
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: `Failed to generate project: ${err.message}`,
    });
  }
});

// ── POST /api/autocomplete ──
app.post("/api/autocomplete", async (req, res) => {
  const { code, language } = req.body;

  if (!code || typeof code !== "string") {
    return res.status(400).json({ suggestion: "" });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an intelligent code autocomplete engine. Given partial code, predict the most likely continuation. Rules:\n" +
            "- Return ONLY the code that comes next (the continuation), nothing else.\n" +
            "- Do NOT repeat any of the existing code.\n" +
            "- Do NOT wrap in markdown code fences.\n" +
            "- Do NOT add explanations or comments.\n" +
            "- Keep the continuation concise (1-3 lines typically).\n" +
            "- Match the existing code style, indentation, and naming conventions.\n" +
            "- If the code ends mid-line, continue from that exact point.\n" +
            "- Return an empty string if no meaningful continuation is possible.",
        },
        {
          role: "user",
          content: `Language: ${language || "javascript"}\n\nContinue this code:\n${code}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 128,
      stop: ["\n\n\n"],
    });

    const raw = completion.choices[0]?.message?.content || "";

    // Strip any accidental markdown fences
    const suggestion = raw
      .replace(/^```[\w]*\n?/gm, "")
      .replace(/```\s*$/gm, "")
      .trimEnd();

    return res.json({ suggestion });
  } catch (err) {
    return res.json({ suggestion: "" });
  }
});

// ── POST /api/github/import ──

app.post("/api/github/import", async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl || !repoUrl.trim()) {
    return res.status(400).json({ error: "No repository URL provided." });
  }

  try {
    // Parse the GitHub URL — supports multiple formats
    // https://github.com/owner/repo
    // https://github.com/owner/repo.git
    // https://github.com/owner/repo/tree/branch
    // github.com/owner/repo
    // owner/repo
    let owner, repo, branch;

    const cleanUrl = repoUrl.trim().replace(/\.git$/, "");

    // Try full URL format
    const urlMatch = cleanUrl.match(
      /(?:https?:\/\/)?github\.com\/([^/]+)\/([^/\s]+)(?:\/tree\/([^/\s]+))?/
    );

    if (urlMatch) {
      owner = urlMatch[1];
      repo = urlMatch[2];
      branch = urlMatch[3] || "main";
    } else {
      // Try owner/repo shorthand
      const shortMatch = cleanUrl.match(/^([^/\s]+)\/([^/\s]+)$/);
      if (shortMatch) {
        owner = shortMatch[1];
        repo = shortMatch[2];
        branch = "main";
      } else {
        return res.status(400).json({
          error:
            'Invalid GitHub URL. Use format: "https://github.com/owner/repo" or "owner/repo"',
        });
      }
    }


    const files = await fetchGitHubTree(owner, repo, branch);

    const fileCount = Object.keys(files).length;
    if (fileCount === 0) {
      return res.status(404).json({ error: "No files found in this repository." });
    }


    return res.json({
      owner,
      repo,
      branch,
      fileCount,
      files,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message || "Failed to import repository.",
    });
  }
});

// ── POST /api/chat ──
// AI Agent Mode — plans step-by-step then executes file actions
app.post("/api/chat", async (req, res) => {
  const { message, files, fileTree, currentFile, history } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "No message provided." });
  }

  try {
    // Build compact file context — only provided file contents (usually just active file)
    let fileContext = "No files available.";
    if (files && Object.keys(files).length > 0) {
      fileContext = Object.entries(files)
        .map(([path, content]) => {
          // Truncate very large files as a safety net
          const truncated = content && content.length > 4000
            ? content.slice(0, 3000) + "\n// ... (truncated)"
            : content || "";
          return `--- ${path} ---\n${truncated}`;
        })
        .join("\n\n");
    }

    // Build compact file tree listing (just paths)
    let treeContext = "";
    if (fileTree && Array.isArray(fileTree) && fileTree.length > 0) {
      treeContext = `\n\nProject file tree:\n${fileTree.map((p) => `  - ${p}`).join("\n")}`;
    }

    const systemPrompt = `You are an AI coding agent integrated into an IDE. Current file: ${currentFile || "unknown"}

${fileContext}
${treeContext}

You must:
1. Think step-by-step about the user's request
2. Break your work into logical steps — each step has a title and file actions
3. Execute file actions as part of each step

Return ONLY valid JSON in this exact format:
{
  "steps": [
    {
      "title": "Step 1 description",
      "actions": [
        { "type": "create", "path": "src/file.js", "content": "full file code here" }
      ]
    },
    {
      "title": "Step 2 description",
      "actions": [
        { "type": "update", "path": "src/other.js", "content": "full updated code" }
      ]
    }
  ],
  "message": "Brief summary of what you did"
}

Rules:
- "steps" is an array of step objects. Each step has a "title" (short description) and "actions" (array of file operations for that step).
- Always include at least 1 step, even if no file changes are needed (use an empty actions array).
- Group related file operations into the same step. Use multiple steps for logically distinct parts.
- Action types: "create" (new file), "update" (modify existing — FULL content), "delete" (remove file).
- Each action: {"type":"create|update|delete","path":"file/path","content":"code"} (content optional for delete).
- If no file changes needed, return a single step with empty actions and a helpful message.
- Keep message concise — it summarizes what you did.
- CRITICAL: Make sure all JSON strings are properly escaped. Backslashes, quotes, and newlines must be escaped for valid JSON.`;

    // Build messages array with conversation history
    const chatMessages = [{ role: "system", content: systemPrompt }];

    // Add conversation history for context
    if (history && Array.isArray(history)) {
      // Only include the last 4 history messages to stay within token limits
      const recentHistory = history.slice(-4);
      for (const msg of recentHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          chatMessages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
    } else {
      chatMessages.push({ role: "user", content: message });
    }

    let raw = "";

    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_CHAT_MODEL,
        messages: chatMessages,
        temperature: 0.2,
        max_tokens: 4096,
      });

      raw = completion.choices[0]?.message?.content || "";
    } catch (groqErr) {
      // Groq sometimes rejects valid-ish JSON with json_validate_failed.
      // The failed_generation field often contains parseable JSON we can salvage.
      const errBody = groqErr?.error || groqErr;
      if (errBody?.failed_generation) {
        raw = errBody.failed_generation;
      } else {
        throw groqErr;
      }
    }

    if (!raw) {
      return res.status(502).json({ error: "Empty response from AI." });
    }

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");

      const result = JSON.parse(jsonMatch[0]);

      // ── Parse new steps format ──
      let steps = [];

      if (Array.isArray(result.steps) && result.steps.length > 0) {
        // New steps format
        steps = result.steps
          .filter((s) => s && typeof s.title === "string")
          .map((s) => ({
            title: s.title.trim(),
            actions: Array.isArray(s.actions)
              ? s.actions.filter(
                  (a) =>
                    a &&
                    typeof a.type === "string" &&
                    typeof a.path === "string" &&
                    ["create", "update", "delete"].includes(a.type)
                )
              : [],
          }));
      } else if (Array.isArray(result.plan) && result.plan.length > 0) {
        // Backward-compat: convert old plan+actions into steps
        const flatActions = Array.isArray(result.actions)
          ? result.actions.filter(
              (a) =>
                a &&
                typeof a.type === "string" &&
                typeof a.path === "string" &&
                ["create", "update", "delete"].includes(a.type)
            )
          : [];

        // Distribute actions across plan steps
        const actionsPerStep = Math.max(
          1,
          Math.ceil(flatActions.length / result.plan.length)
        );
        steps = result.plan
          .filter((step) => typeof step === "string" && step.trim())
          .map((title, i) => ({
            title: title.trim(),
            actions: flatActions.slice(
              i * actionsPerStep,
              (i + 1) * actionsPerStep
            ),
          }));
      }

      // Fallback: if we got actions but no steps/plan, make a single step
      if (steps.length === 0) {
        const fallbackActions = Array.isArray(result.actions)
          ? result.actions.filter(
              (a) =>
                a &&
                typeof a.type === "string" &&
                typeof a.path === "string" &&
                ["create", "update", "delete"].includes(a.type)
            )
          : [];

        if (fallbackActions.length > 0) {
          steps = [{ title: "Applying changes", actions: fallbackActions }];
        }
      }

      const responseMessage =
        result.message || "Done. Check the updated files.";

      // Collect all actions across steps for logging
      const totalActions = steps.reduce(
        (sum, s) => sum + s.actions.length,
        0
      );


      // ── Self-Review Pass — verify generated code quality ──
      let fixSteps = [];
      let confidence = 1.0;

      if (totalActions > 0) {
        try {
          // Build a summary of all generated/updated files for review
          const generatedFiles = steps
            .flatMap((s) => s.actions)
            .filter((a) => a.type !== "delete" && a.content)
            .map((a) => `--- ${a.path} ---\n${a.content.slice(0, 3000)}`)
            .join("\n\n");

          if (generatedFiles.length > 0) {
            const reviewSystemPrompt = `You are reviewing your own code output for quality issues.

Original user request: "${message}"

Generated files:
${generatedFiles}

Check for:
- missing imports or require statements
- syntax errors (unclosed brackets, missing semicolons, typos)
- incomplete logic (TODO placeholders, unfinished functions, missing error handling)
- mismatched exports/imports between files
- undefined variables or functions referenced but never declared

Return ONLY valid JSON:
{
  "confidence": <number between 0 and 1 indicating how confident you are the code is correct>,
  "issues": ["short description of each issue found"],
  "fixSteps": [
    {
      "title": "Fix: description of fix",
      "actions": [
        { "type": "update", "path": "file/path", "content": "full corrected file content" }
      ]
    }
  ]
}

Rules:
- "confidence" must be a number between 0.0 and 1.0 (e.g. 0.95 means high confidence)
- If NO issues found, return: {"confidence": 0.95, "issues": [], "fixSteps": []}
- Only include fixSteps for real, concrete issues — not style preferences
- Each fix action must include the FULL corrected file content
- Keep it concise — only fix genuine bugs`;

            const reviewRaw = await callGroq(
              reviewSystemPrompt,
              "Review the code above and report issues.",
              true
            );

            if (reviewRaw) {
              try {
                const reviewMatch = reviewRaw.match(/\{[\s\S]*\}/);
                if (reviewMatch) {
                  const reviewResult = JSON.parse(reviewMatch[0]);

                  // Extract confidence
                  if (typeof reviewResult.confidence === "number") {
                    confidence = Math.max(0, Math.min(1, reviewResult.confidence));
                  }

                  // Extract fix steps
                  if (Array.isArray(reviewResult.fixSteps) && reviewResult.fixSteps.length > 0) {
                    fixSteps = reviewResult.fixSteps
                      .filter((s) => s && typeof s.title === "string")
                      .map((s) => ({
                        title: s.title.trim(),
                        actions: Array.isArray(s.actions)
                          ? s.actions.filter(
                              (a) =>
                                a &&
                                typeof a.type === "string" &&
                                typeof a.path === "string" &&
                                ["create", "update", "delete"].includes(a.type)
                            )
                          : [],
                      }))
                      .filter((s) => s.actions.length > 0);
                  }

                  const issueCount = reviewResult.issues?.length || 0;
                }
              } catch (reviewParseErr) {
                // Non-critical — continue without fixes
              }
            }
          }
        } catch (reviewErr) {
          // Non-critical — continue without fixes
        }
      }

      return res.json({
        steps,
        fixSteps,
        confidence,
        message: responseMessage,
      });
    } catch (parseErr) {
      // If parsing fails, return the raw text as a message
      return res.json({
        steps: [],
        message: raw.slice(0, 2000),
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: `Chat failed: ${err.message}`,
    });
  }
});

// ── POST /api/export ──
// Creates a ZIP archive from the project files and sends it as a download
app.post("/api/export", (req, res) => {
  const { files, projectName } = req.body;

  if (!files || typeof files !== "object" || Object.keys(files).length === 0) {
    return res.status(400).json({ error: "No files to export." });
  }

  const zipName = (projectName || "project").replace(/[^a-z0-9_-]/gi, "-");

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipName}.zip"`);

  const archive = archiver("zip", { zlib: { level: 6 } });

  archive.on("error", (err) => {
    res.status(500).end();
  });

  archive.pipe(res);

  // Add each file to the archive
  Object.entries(files).forEach(([filePath, content]) => {
    // Skip .gitkeep placeholder files
    if (filePath.endsWith(".gitkeep") && content === "") return;
    archive.append(content || "", { name: filePath });
  });

  archive.finalize();
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`\n🚀 AI Code Editor Backend running on http://localhost:${PORT}`);
  console.log(`📦 Model: ${GROQ_MODEL}`);
  console.log(`⚡ Provider: Groq (Cloud AI)\n`);
});
