// Fetches a public GitHub repository's file tree and contents
async function fetchGitHubTree(owner, repo, branch = "main") {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "AI-Code-Editor",
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `token ${GITHUB_TOKEN}`;
  }

  // 1. Try to get the recursive tree using Git Trees API (fast, single call)
  async function tryBranch(branchName) {
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branchName}?recursive=1`;
    const res = await fetch(treeUrl, { headers });
    if (!res.ok) return null;
    return res.json();
  }

  let treeData = await tryBranch(branch);
  if (!treeData) {
    // Fallback: try "master" if "main" fails
    treeData = await tryBranch("master");
  }
  if (!treeData) {
    throw new Error(
      `Could not access repository "${owner}/${repo}". Make sure it exists and is public.`
    );
  }

  // 2. Filter to only blobs (files), skip large files, skip common non-text
  const SKIP_DIRS = [
    "node_modules/",
    ".git/",
    "__pycache__/",
    "dist/",
    "build/",
    ".next/",
    "vendor/",
    ".venv/",
    "venv/",
    ".idea/",
    ".vscode/",
  ];

  const SKIP_EXTENSIONS = /\.(png|jpg|jpeg|gif|bmp|ico|svg|woff|woff2|ttf|eot|mp3|mp4|avi|mov|zip|tar|gz|exe|dll|so|dylib|pdf|lock|min\.js|min\.css|map)$/i;

  const MAX_FILE_SIZE = 256 * 1024; // 256KB per file
  const MAX_FILES = 150; // Cap total files to import

  const blobs = (treeData.tree || [])
    .filter((item) => {
      if (item.type !== "blob") return false;
      if (item.size && item.size > MAX_FILE_SIZE) return false;
      if (SKIP_DIRS.some((dir) => item.path.includes(dir))) return false;
      if (SKIP_EXTENSIONS.test(item.path)) return false;
      return true;
    })
    .slice(0, MAX_FILES);

  if (blobs.length === 0) {
    throw new Error("No importable source files found in this repository.");
  }

  // 3. Fetch file contents in parallel (batched to avoid rate limits)
  const BATCH_SIZE = 15;
  const files = {};

  for (let i = 0; i < blobs.length; i += BATCH_SIZE) {
    const batch = blobs.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (blob) => {
        const contentUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${blob.path}?ref=${treeData.sha || branch}`;
        const res = await fetch(contentUrl, { headers });
        if (!res.ok) return null;

        const data = await res.json();
        if (!data.content) return null;

        try {
          // GitHub returns base64-encoded content
          const decoded = Buffer.from(data.content, "base64").toString("utf-8");
          return { path: blob.path, content: decoded };
        } catch {
          return null;
        }
      })
    );

    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value) {
        files[r.value.path] = r.value.content;
      }
    });
  }

  return files;
}

module.exports = { fetchGitHubTree };
