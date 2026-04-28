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

module.exports = { parseCodeFallback };
