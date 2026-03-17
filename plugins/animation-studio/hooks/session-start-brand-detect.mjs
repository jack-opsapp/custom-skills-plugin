// hooks/session-start-brand-detect.mjs
// SessionStart hook: detects whether a brand motion config exists.
// If missing: injects brand-setup-flow.md prompt.
// If present: writes session state file for PreToolUse to read later.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

const PLUGIN_ROOT = resolve(import.meta.dirname, "..");

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, "utf-8"));
  } catch {
    process.stdout.write("{}");
    return;
  }

  const sessionId = input.session_id || "";
  const cwd = input.cwd || process.cwd();
  const isCursor =
    "conversation_id" in input || "cursor_version" in input;

  // Check for brand config in the project
  const brandConfigPath = join(cwd, ".claude", "animation-studio.local.md");
  const brandExists = existsSync(brandConfigPath);

  if (brandExists) {
    // Write session state file so PreToolUse knows brand config exists
    if (sessionId) {
      const stateDir = join(
        "/tmp",
        `animation-studio-${hashString(sessionId)}`
      );
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(
        join(stateDir, "brand-config-path.txt"),
        brandConfigPath,
        "utf-8"
      );
    }
    // No output — brand config will be injected by PreToolUse when needed
    process.stdout.write("{}");
    return;
  }

  // Brand config missing — inject the setup flow prompt
  let setupPrompt;
  try {
    setupPrompt = readFileSync(
      join(PLUGIN_ROOT, "hooks", "brand-setup-flow.md"),
      "utf-8"
    );
  } catch {
    setupPrompt =
      "Animation Studio: No brand motion config found. Run the brand setup flow before animation work.";
  }

  const output = isCursor
    ? { additional_context: setupPrompt, continue: true }
    : {
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext: setupPrompt,
        },
      };

  process.stdout.write(JSON.stringify(output));
}

function hashString(str) {
  return createHash("sha256").update(str).digest("hex").slice(0, 16);
}

main();
