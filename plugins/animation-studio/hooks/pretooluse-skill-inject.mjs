// hooks/pretooluse-skill-inject.mjs
// PreToolUse hook: auto-injects animation skills when editing animation code.
// Matches file paths and content against skill metadata.
// Enforces MAX_SKILLS and byte budget. Deduplicates per session.

import {
  readFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  openSync,
  closeSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import {
  loadSkillMap,
  getMetadata,
  matchesPathPatterns,
  matchesImportPatterns,
} from "./lib/frontmatter.mjs";

const PLUGIN_ROOT = resolve(import.meta.dirname, "..");
const MAX_SKILLS = 3;
const INJECTION_BUDGET_BYTES = 18000;

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, "utf-8"));
  } catch {
    process.stdout.write("{}");
    return;
  }

  const toolName = input.tool_name || "";
  const toolInput = input.tool_input || {};
  const sessionId = input.session_id || "";
  const agentId = input.agent_id || "main";
  const cwd = input.cwd || process.cwd();
  const isCursor =
    "conversation_id" in input || "cursor_version" in input;

  // Extract file path and content from tool input
  const filePath = toolInput.file_path || "";
  let content = "";
  if (toolName === "Write") {
    content = toolInput.content || "";
  } else if (toolName === "Edit") {
    content =
      (toolInput.old_string || "") + "\n" + (toolInput.new_string || "");
  }

  if (!filePath) {
    process.stdout.write("{}");
    return;
  }

  // Load skill map
  const skillMap = loadSkillMap(PLUGIN_ROOT);
  if (skillMap.size === 0) {
    process.stdout.write("{}");
    return;
  }

  // Match skills against file path and content
  const matched = [];
  for (const [name, skill] of skillMap) {
    const metadata = getMetadata(skill);
    const pathMatch = matchesPathPatterns(
      filePath,
      metadata.pathPatterns
    );
    const importMatch = matchesImportPatterns(
      content,
      metadata.importPatterns
    );

    if (pathMatch || importMatch) {
      matched.push({
        name,
        skill,
        priority: Number(metadata.priority) || 0,
        matchType: pathMatch && importMatch ? "both" : pathMatch ? "path" : "import",
      });
    }
  }

  if (matched.length === 0) {
    process.stdout.write("{}");
    return;
  }

  // Dedup: check which skills have already been injected this session
  const scopeId = agentId || "main";
  const injectedSet = getInjectedSkills(sessionId, scopeId);

  const newMatches = matched.filter((m) => !injectedSet.has(m.name));
  if (newMatches.length === 0) {
    process.stdout.write("{}");
    return;
  }

  // Sort by priority descending
  newMatches.sort((a, b) => b.priority - a.priority);

  // Enforce MAX_SKILLS and byte budget
  const toInject = [];
  let totalBytes = 0;

  for (const match of newMatches) {
    if (toInject.length >= MAX_SKILLS) break;

    const skillContent = match.skill.content || "";
    const skillBytes = Buffer.byteLength(skillContent, "utf-8");

    if (totalBytes + skillBytes > INJECTION_BUDGET_BYTES) {
      // Skip this one if it would exceed budget
      continue;
    }

    toInject.push(match);
    totalBytes += skillBytes;
  }

  if (toInject.length === 0) {
    process.stdout.write("{}");
    return;
  }

  // Load brand config if available
  let brandConfig = "";
  const brandPath = getBrandConfigPath(sessionId, cwd);
  if (brandPath) {
    try {
      const brandContent = readFileSync(brandPath, "utf-8");
      const brandBytes = Buffer.byteLength(brandContent, "utf-8");
      if (totalBytes + brandBytes <= INJECTION_BUDGET_BYTES) {
        brandConfig =
          "\n\n---\n## Brand Motion Identity\n\n" + brandContent;
        totalBytes += brandBytes;
      }
    } catch {
      // Brand config unreadable — skip silently
    }
  }

  // Build injection text
  const parts = [];
  const injectedNames = [];

  for (const match of toInject) {
    parts.push(match.skill.content);
    injectedNames.push(match.name);
  }

  // Suggest specialized skills that matched but didn't make the injection cut
  const suggestions = [];
  for (const match of newMatches) {
    if (!injectedNames.includes(match.name) && match.priority <= 6) {
      suggestions.push(`animation-studio:${match.name}`);
    }
  }

  let additionalContext =
    `[animation-studio] Auto-injected skills: ${injectedNames.map((n) => `\`${n}\``).join(", ")}\n\n` +
    parts.join("\n\n---\n\n") +
    brandConfig;

  if (suggestions.length > 0) {
    additionalContext +=
      `\n\n---\n[animation-studio] Also relevant: ${suggestions.map((s) => `\`${s}\``).join(", ")}. Use the Skill tool to load if needed.`;
  }

  // Update dedup state
  for (const name of injectedNames) {
    markInjected(sessionId, scopeId, name);
  }

  // Output
  const output = isCursor
    ? { additional_context: additionalContext, continue: true }
    : {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          additionalContext,
        },
      };

  process.stdout.write(JSON.stringify(output));
}

// --- Session state helpers ---

function getSessionDir(sessionId) {
  if (!sessionId) return null;
  const hash = createHash("sha256")
    .update(sessionId)
    .digest("hex")
    .slice(0, 16);
  return join("/tmp", `animation-studio-${hash}`);
}

function getInjectedSkills(sessionId, scopeId) {
  const set = new Set();
  const dir = getSessionDir(sessionId);
  if (!dir) return set;

  const claimDir = join(dir, `seen-skills-${scopeId}.d`);
  try {
    const entries = readdirSync(claimDir);
    for (const entry of entries) {
      set.add(decodeURIComponent(entry));
    }
  } catch {
    // No claims yet
  }

  return set;
}

function markInjected(sessionId, scopeId, skillName) {
  const dir = getSessionDir(sessionId);
  if (!dir) return;

  const claimDir = join(dir, `seen-skills-${scopeId}.d`);
  mkdirSync(claimDir, { recursive: true });

  const file = join(claimDir, encodeURIComponent(skillName));
  try {
    const fd = openSync(file, "wx"); // exclusive create — fails if exists (atomic dedup)
    closeSync(fd);
  } catch {
    // Already claimed — fine
  }
}

function getBrandConfigPath(sessionId, cwd) {
  // First check session state file (set by SessionStart hook)
  const dir = getSessionDir(sessionId);
  if (dir) {
    try {
      return readFileSync(join(dir, "brand-config-path.txt"), "utf-8").trim();
    } catch {
      // No session state — fall through
    }
  }

  // Fallback: check the project directly
  const directPath = join(cwd, ".claude", "animation-studio.local.md");
  return existsSync(directPath) ? directPath : null;
}

main();
