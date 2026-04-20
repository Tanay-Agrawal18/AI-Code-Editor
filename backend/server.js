const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// ── Initialize Groq Client ──
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Middleware ──
app.use(cors());
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
    max_tokens: 4096,
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
    console.error("Groq explain error:", err.message);
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
    console.error("Groq intent error:", err.message);
    return res.status(500).json({
      error: `Failed to apply intent: ${err.message}`,
    });
  }
});

// ── POST /api/visualize ──
// Deterministic regex-based code parser (fast, no API call needed)
function parseCodeFallback(code) {
  const nodes = new Set();
  const edges = [];

  const funcPatterns = [
    /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
    /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\(/g,
    /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?function/g,
    /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g,
    /def\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
    /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
  ];

  for (const pat of funcPatterns) {
    let m;
    while ((m = pat.exec(code)) !== null) {
      const name = m[1];
      if (!["if", "for", "while", "switch", "catch", "return", "class", "import", "export", "from", "require", "console"].includes(name)) {
        nodes.add(name);
      }
    }
  }

  if (nodes.size === 0) {
    return { nodes: [], edges: [] };
  }

  const nodeArr = [...nodes];

  const funcBodyPattern = /(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?(?:function|\([^)]*\)\s*=>))\s*[^{]*\{/g;
  let bodyMatch;

  while ((bodyMatch = funcBodyPattern.exec(code)) !== null) {
    const caller = bodyMatch[1] || bodyMatch[2];
    if (!caller || !nodes.has(caller)) continue;

    const restOfCode = code.slice(bodyMatch.index + bodyMatch[0].length);
    const body = restOfCode.slice(0, 2000);

    for (const target of nodeArr) {
      if (target === caller) continue;
      const callPattern = new RegExp(`\\b${target}\\s*\\(`, "g");
      if (callPattern.test(body)) {
        edges.push({ from: caller, to: target });
      }
    }
  }

  return { nodes: nodeArr, edges };
}

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
      console.error("Failed to parse Groq JSON:", parseErr.message);
      return res.status(200).json({
        nodes: [],
        edges: [],
        warning: "No functions detected in the code.",
      });
    }
  } catch (err) {
    console.error("Groq visualize error:", err.message);
    return res.status(200).json({
      nodes: [],
      edges: [],
      warning: "No functions detected in the code. Try adding function definitions.",
    });
  }
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`\n🚀 AI Code Editor Backend running on http://localhost:${PORT}`);
  console.log(`📦 Model: ${GROQ_MODEL}`);
  console.log(`⚡ Provider: Groq (Cloud AI)\n`);
});
