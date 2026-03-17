// hooks/lib/frontmatter.mjs
// Parses YAML frontmatter from SKILL.md files.
// Minimal YAML parser — handles the subset we use (strings, arrays, nested objects, booleans, numbers).

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Parse YAML frontmatter from a markdown string.
 * Returns { frontmatter: object, body: string } or null if no frontmatter.
 */
export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const body = content.slice(match[0].length).trim();
  const frontmatter = parseSimpleYaml(yaml);

  return { frontmatter, body };
}

/**
 * Parse a simple YAML string into a JS object.
 * Supports: strings, arrays (inline [...] and - item), nested objects via indentation,
 * booleans, numbers.
 */
function parseSimpleYaml(yaml) {
  const result = {};
  const lines = yaml.split("\n");
  // Stack tracks: obj (the current object), indent level, and key (the key on the parent that points to obj)
  const stack = [{ obj: result, indent: -1, key: null }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimEnd();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = line.search(/\S/);
    const content = trimmed.trim();

    // Pop stack to find parent at correct indent level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const top = stack[stack.length - 1];
    const parent = top.obj;

    // Array item (- value)
    if (content.startsWith("- ")) {
      const itemValue = parseValue(content.slice(2).trim());

      if (Array.isArray(parent)) {
        // Parent is already an array — push directly
        parent.push(itemValue);
      } else {
        // Parent is an object — check if it was a placeholder for a list.
        // This happens when YAML has:
        //   pathPatterns:
        //     - "**/*.tsx"
        // pathPatterns was created as {} and pushed onto the stack.
        // We need to convert it to an array on the grandparent.
        const grandparent = stack.length > 1 ? stack[stack.length - 2] : null;
        if (grandparent && top.key && typeof grandparent.obj[top.key] === "object" && !Array.isArray(grandparent.obj[top.key]) && Object.keys(grandparent.obj[top.key]).length === 0) {
          // Convert the empty placeholder object to an array
          const arr = [itemValue];
          grandparent.obj[top.key] = arr;
          top.obj = arr;
        } else {
          // Fallback: find the last key on parent and convert to array
          const key = Object.keys(parent).pop();
          if (key && !Array.isArray(parent[key])) parent[key] = [];
          if (key) parent[key].push(itemValue);
        }
      }
      continue;
    }

    // Key: value pair
    const colonIdx = content.indexOf(":");
    if (colonIdx === -1) continue;

    const key = content.slice(0, colonIdx).trim();
    const rawValue = content.slice(colonIdx + 1).trim();

    if (rawValue === "" || rawValue === "|") {
      // Nested object or block scalar — create sub-object
      parent[key] = {};
      stack.push({ obj: parent[key], indent, key });
    } else {
      parent[key] = parseValue(rawValue);
    }
  }

  return result;
}

/**
 * Parse a YAML value string into a JS value.
 */
function parseValue(str) {
  if (!str) return "";

  // Inline array: [a, b, c]
  if (str.startsWith("[") && str.endsWith("]")) {
    return str
      .slice(1, -1)
      .split(",")
      .map((s) => parseValue(s.trim()))
      .filter((s) => s !== "");
  }

  // Inline object: { key: val, key2: val2 }
  if (str.startsWith("{") && str.endsWith("}")) {
    const obj = {};
    const inner = str.slice(1, -1);
    const pairs = inner.split(",");
    for (const pair of pairs) {
      const ci = pair.indexOf(":");
      if (ci !== -1) {
        obj[pair.slice(0, ci).trim()] = parseValue(pair.slice(ci + 1).trim());
      }
    }
    return obj;
  }

  // Quoted string
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    return str.slice(1, -1);
  }

  // Boolean
  if (str === "true") return true;
  if (str === "false") return false;

  // Number
  if (/^-?\d+(\.\d+)?$/.test(str)) return Number(str);

  return str;
}

/**
 * Load all SKILL.md files from the skills directory.
 * Returns a Map<skillName, { frontmatter, body, path, content }>.
 */
export function loadSkillMap(pluginRoot) {
  const skillsDir = join(pluginRoot, "skills");
  const map = new Map();

  let entries;
  try {
    entries = readdirSync(skillsDir);
  } catch {
    return map;
  }

  for (const entry of entries) {
    const skillDir = join(skillsDir, entry);
    try {
      if (!statSync(skillDir).isDirectory()) continue;
    } catch {
      continue;
    }

    const skillMdPath = join(skillDir, "SKILL.md");
    let content;
    try {
      content = readFileSync(skillMdPath, "utf-8");
    } catch {
      continue;
    }

    const parsed = parseFrontmatter(content);
    if (!parsed) continue;

    map.set(entry, {
      frontmatter: parsed.frontmatter,
      body: parsed.body,
      path: skillMdPath,
      content,
    });
  }

  return map;
}

/**
 * Get the metadata from a skill's frontmatter.
 */
export function getMetadata(skill) {
  return skill?.frontmatter?.metadata || {};
}

/**
 * Test if a file path matches any of the skill's pathPatterns.
 * Uses glob-like matching (**, *).
 */
export function matchesPathPatterns(filePath, patterns) {
  if (!patterns || !Array.isArray(patterns)) return false;
  const normalized = filePath.replace(/\\/g, "/");

  for (const pattern of patterns) {
    if (globMatch(normalized, pattern)) return true;
    // Also try matching just the basename
    const basename = normalized.split("/").pop();
    if (globMatch(basename, pattern)) return true;
  }
  return false;
}

/**
 * Test if content contains any of the skill's importPatterns.
 */
export function matchesImportPatterns(content, patterns) {
  if (!patterns || !Array.isArray(patterns) || !content) return false;
  for (const pattern of patterns) {
    if (content.includes(pattern)) return true;
  }
  return false;
}

/**
 * Test if a prompt contains any of the skill's promptSignals phrases.
 * Case-insensitive matching.
 */
export function matchesPromptSignals(prompt, signals) {
  if (!signals?.phrases || !Array.isArray(signals.phrases)) return false;
  const lower = prompt.toLowerCase();
  for (const phrase of signals.phrases) {
    if (lower.includes(phrase.toLowerCase())) return true;
  }
  return false;
}

// Simple glob matcher supporting **, *, and ?.
// Handles globstar-slash as zero-or-more path segments (including the trailing slash).
// Uses placeholder tokens to prevent regex metacharacters from interfering.
function globMatch(str, pattern) {
  const regex = pattern
    .replace(/\?/g, "<<<QMARK>>>")               // 1. protect glob ? before any regex syntax is introduced
    .replace(/\./g, "\\.")                        // 2. escape dots
    .replace(/\*\*\//g, "<<<GLOBSTARSLASH>>>")    // 3. mark **/ (zero-or-more segments with trailing /)
    .replace(/\*\*/g, "<<<GLOBSTAR>>>")           // 4. mark bare ** (any chars including /)
    .replace(/\*/g, "[^/]*")                      // 5. single * → non-slash chars
    .replace(/<<<GLOBSTARSLASH>>>/g, "(.+/)?")    // 6. restore **/ → optional path prefix
    .replace(/<<<GLOBSTAR>>>/g, ".*")             // 7. restore bare ** → any chars
    .replace(/<<<QMARK>>>/g, ".");                // 8. restore ? → single char
  return new RegExp("^" + regex + "$").test(str);
}
