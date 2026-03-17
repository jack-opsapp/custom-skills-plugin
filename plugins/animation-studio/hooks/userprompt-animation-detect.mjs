// hooks/userprompt-animation-detect.mjs
// UserPromptSubmit hook: detects animation intent in the user's prompt.
// Outputs a lightweight suggestion (not full skill injection).

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadSkillMap, getMetadata, matchesPromptSignals } from "./lib/frontmatter.mjs";

const PLUGIN_ROOT = resolve(import.meta.dirname, "..");

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, "utf-8"));
  } catch {
    process.stdout.write("{}");
    return;
  }

  const prompt = input.prompt || "";
  if (!prompt.trim()) {
    process.stdout.write("{}");
    return;
  }

  const isCursor =
    "conversation_id" in input || "cursor_version" in input;

  // Load skill map and check for prompt signal matches
  const skillMap = loadSkillMap(PLUGIN_ROOT);
  const matched = [];

  for (const [name, skill] of skillMap) {
    const metadata = getMetadata(skill);
    if (matchesPromptSignals(prompt, metadata.promptSignals)) {
      matched.push(name);
    }
  }

  if (matched.length === 0) {
    process.stdout.write("{}");
    return;
  }

  // Build suggestion text
  const skillList = matched
    .map((s) => `\`animation-studio:${s}\``)
    .join(", ");

  const suggestion = `[animation-studio] Animation-related work detected. Relevant skills: ${skillList}. Use the Skill tool to invoke \`animation-studio:animation-architect\` (gateway) plus the appropriate platform/specialized skill.`;

  const output = isCursor
    ? { additional_context: suggestion, continue: true }
    : {
        hookSpecificOutput: {
          hookEventName: "UserPromptSubmit",
          additionalContext: suggestion,
        },
      };

  process.stdout.write(JSON.stringify(output));
}

main();
