## Animation Studio — Brand Motion Setup Required

No brand motion identity found for this project. Before any
animation work, you must create one.

### Instructions

1. Ask the user: "Do you have an existing design system, brand
   identity file, or interface design config I should read first?"

2. If yes: Read the file. Extract colors, typography, radii, and
   any motion guidance. Then ask targeted follow-up questions for
   gaps (see questions below, skip any already answered by the file).

3. If no: Ask the full questionnaire below, one question at a time.

### Questionnaire (ask one at a time)

**Q1 (FIRST — most important):**
"Who is your user, and what are they feeling when they encounter
your product?" (open-ended — understand starting emotional state)

**Q2:** "What should they feel after? Describe the emotional shift
you're engineering." (open-ended — the specific texture of the
feeling, not generic words like "happy")

**Q3:** "How would you describe the visual personality?"
- Military tactical minimalist
- Playful energetic
- Corporate refined
- Organic natural
- Brutalist bold
- Custom description

**Q4:** "How should animations feel?"
- Crisp & precise
- Fluid & organic
- Bouncy & elastic
- Minimal & restrained
- Cinematic & dramatic

**Q5:** "Animation tempo?"
- Fast (0.15-0.3s)
- Moderate (0.3-0.5s)
- Deliberate (0.5-0.8s)

**Q6:** "When the user accomplishes something, how should the app
react?"
- Subtle pulse / stamp
- Confetti / particles
- Clean checkmark with haptic
- Understated glow
- Nothing — the result speaks

**Q7:** "Primary colors?" (background, surface, accent, text,
status colors)

**Q8:** "Font families?" (with weights and ALL CAPS rules)

**Q9:** "How should haptics be used?"
- Every meaningful interaction
- Only confirmations and errors
- Sparingly
- No haptics

**Q10:** "Where will these animations run?"
- Web only
- iOS only
- Both web and iOS
- Other

### Output

Write the brand motion config to `.claude/animation-studio.local.md`
using the template at `${CLAUDE_PLUGIN_ROOT}/brand-config-template.md`.
Populate the YAML frontmatter with the structured answers (colors,
fonts, speeds, haptic preference, platforms). Write the emotional
arc (Q1+Q2 answers) and brand direction (Q3+Q4 synthesis) into the
markdown body.

Ask the user: "Should this brand config be committed to git (shared
with your team) or added to .gitignore (personal to you)?"
