---
name: media-director
version: 1.0.0
description: >
  Use when planning video content, writing video scripts, writing voice-over scripts for text-to-speech
  or voice generation tools, planning visual assets, or determining what media a lesson needs.
  Triggers on "plan the video", "write a script", "voice-over script", "what media do we need",
  "video script", "TTS script", "media plan", or any task involving media production planning.
---

# Media Director

## Purpose

Plan and script all media assets for ops-learn lessons. Determine what each lesson needs (video, audio, visuals), write production-ready scripts, and create voice-over scripts formatted for text-to-speech and voice generation tools.

## Media Assessment

For each lesson, evaluate:

| Question | If Yes |
|----------|--------|
| Does the concept need visual demonstration? | Video (screen recording or animation) |
| Is this a personal/motivational topic? | Video (talking head / founder-style) |
| Would seeing a real job site help? | Video (b-roll footage) |
| Is text + interactive tool sufficient? | No video needed |
| Is there a process to show step-by-step? | Video (screen recording) or animated diagram |

**Not every lesson needs video.** Text + interactive tools can be more effective for financial/analytical concepts. Video excels for motivation, demonstration, and storytelling.

## Video Types

### Talking Head
- Founder/expert speaking directly to camera
- Best for: motivation, personal stories, setting the stage
- Duration: 2-4 minutes
- Production: Camera, good lighting, simple background

### Screen Recording
- Software walkthrough, spreadsheet demo, tool demonstration
- Best for: showing how to use tools, demonstrating calculations, walkthroughs
- Duration: 3-5 minutes
- Production: Screen capture software, clean desktop, voiceover

### Animation / Motion Graphics
- Concept visualization, process flows, data visualization
- Best for: abstract concepts, comparisons, systems thinking
- Duration: 1-3 minutes
- Production: After Effects, Canva, or similar

### B-Roll / Job Site
- Real footage of trades work, job sites, crews in action
- Best for: establishing credibility, showing context, transitions
- Duration: 10-30 second clips woven into other video
- Production: On-site footage

### Hybrid
- Combination of talking head + screen recording + b-roll
- Most common format for substantive lessons
- Duration: 3-7 minutes

## Script Format

Use this structure for all video scripts:

```
TITLE: [Lesson Title] — Video Script
TYPE: [Talking Head / Screen Recording / Hybrid / Animation]
DURATION: ~[X] minutes
TALENT: [Who's on camera / voice]

---

[VISUAL: Description of what viewer sees]
[AUDIO]: "Exact words spoken"

[VISUAL: Next shot description]
[AUDIO]: "Next words spoken"

[BEAT: X seconds — pause, no dialogue]

[TRANSITION: Description of transition]

[LOWER THIRD: Text overlay content]

[MUSIC: Description of mood/energy]

[B-ROLL: Description of footage to show]

---

END
```

## Script Structure

Every lesson video follows this arc:

### 1. Hook (0-10 seconds)
Grab attention with a relatable problem, surprising stat, or provocative question.

```
[VISUAL: Close-up of contractor looking at phone, frustrated]
[AUDIO]: "You worked 60 hours last week. Your crew billed 40 jobs. And somehow, you cleared less than a thousand bucks."
```

### 2. Setup (10-30 seconds)
Frame the problem and preview what the student will learn.

```
[VISUAL: Cut to talking head]
[AUDIO]: "Today we're going to fix that. By the end of this lesson, you'll know exactly where your money is going — and how to keep more of it."
```

### 3. Core Teaching (30 seconds - 3 minutes)
Deliver the main content. Use visuals to support concepts.

```
[VISUAL: Animated diagram showing revenue flowing through expense categories]
[AUDIO]: "Most contractors think of profit as 'what's left over.' That's backwards. Profit isn't leftovers — it's the whole point..."
```

### 4. Demo / Example (30 seconds - 2 minutes, if applicable)
Show the concept in action with a real example.

```
[VISUAL: Screen recording of the profit calculator tool]
[AUDIO]: "Let me show you what this looks like with real numbers. Say you've got a deck job for twenty-five hundred..."
```

### 5. Wrap + Transition (10-20 seconds)
Summarize key takeaway. Bridge to the next content block.

```
[VISUAL: Talking head, direct to camera]
[AUDIO]: "Know your numbers. Not the top line — the bottom line. Use the calculator below to plug in YOUR numbers, and then we'll move on to fixing the gaps."
[LOWER THIRD: "Use the profit calculator below"]
```

## Voice-Over Scripts for TTS / Voice Generation

When creating scripts for text-to-speech or AI voice generation tools, use this format:

```
VOICE CHARACTERISTICS:
- Tone: Confident, conversational, like a mentor
- Pace: Moderate (not rushed, not slow)
- Energy: Grounded authority, not hype
- Style: Think contractor who reads business books, not professor

---

You worked sixty hours last week.

Your crew billed forty jobs.

And somehow... you cleared less than a thousand bucks.

[PAUSE]

Sound familiar?

Here's the thing most contractors get wrong about profit.

They think of it as what's left over. Revenue minus expenses, whatever's left, that's profit.

[PAUSE]

That's backwards.

Profit isn't leftovers. Profit is the whole point.

...
```

**TTS formatting rules:**
- Plain text only — no stage directions inline
- Use `[PAUSE]` for beats / dramatic pauses
- Use `...` for trailing off / natural pauses
- One thought per line for natural pacing
- *Asterisks* around words that need vocal emphasis
- Spell out numbers: "sixty hours" not "60 hours"
- Phonetic spelling for unusual terms if needed
- Indicate paragraph breaks with blank lines

## Visual Asset Planning

For each lesson, create an asset list:

```
LESSON: [Title]

VIDEO ASSETS:
- [ ] Talking head intro (2 min) — Script: see above
- [ ] Screen recording of calculator tool (1 min)

STATIC ASSETS:
- [ ] Diagram: Revenue flow breakdown (show where money goes)
- [ ] Infographic: 3 key metrics every contractor should track

STOCK FOOTAGE:
- [ ] Job site establishing shot (10s)
- [ ] Crew working / contractor on phone (10s b-roll)

AUDIO:
- [ ] Background music: Ambient, low-energy, professional (for under talking head)
- [ ] Voice-over for animation segment (see TTS script)
```

## Process

1. **Review the lesson content** — understand what's being taught
2. **Assess media needs** — what type of video (if any) + what visuals
3. **Write the video script** — using the standard structure
4. **Write TTS/voice-over scripts** — for any audio segments
5. **Create asset list** — everything needed for production
6. **Present to user for review** — scripts + asset list

## After Approval

Media scripts and asset lists are reference documents — they don't get inserted into Supabase. They guide production. Once media is produced:
- Video files get uploaded and referenced in `content_blocks` as `video` type blocks
- The lesson-copywriter skill handles inserting the video content block with the URL
