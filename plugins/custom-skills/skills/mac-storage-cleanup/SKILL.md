---
name: mac-storage-cleanup
description: This skill should be used when the user asks about "system storage", "disk space", "storage is full", "why is my mac taking up so much space", "free up storage", "clean up disk", "system data is large", or mentions macOS storage being unexpectedly high. Provides a prioritized investigation workflow and known culprit locations to check first before doing broad searches.
version: 1.0.0
---

# macOS Storage Cleanup

Provides a prioritized, ordered investigation workflow for diagnosing and freeing macOS disk space — starting with the highest-yield locations first.

## Investigation Order

Always check in this order. Stop when you find the culprit.

### Step 1: Quick Size Overview

```bash
diskutil info disk3s5 | grep -E "Used|Free|Capacity"
du -sh ~/Library ~/Library/Developer /Library/Developer /Applications /private/tmp /private/var 2>/dev/null | sort -rh
```

### Step 2: /private/tmp (Highest Yield — Often Missed)

`/tmp` is **not cleared until reboot** on macOS with APFS. Build tools, CI scripts, and Xcode can leave large artifacts here that accumulate silently.

```bash
du -d1 /private/tmp 2>/dev/null | sort -rn | head -20
```

**Known offenders:**
- `OPS-DerivedData`, `OPS-build` — Xcode build outputs placed in /tmp by build scripts
- Any directory over 500 MB in /tmp is a candidate for deletion
- Safe to delete anything in /tmp that's not actively in use

### Step 3: Xcode Caches (~30–40 GB on active dev machines)

```bash
du -sh ~/Library/Developer/Xcode/DerivedData
du -sh ~/Library/Developer/Xcode/UserData/IB\ Support
du -sh ~/Library/Developer/Xcode/UserData/Previews
du -sh ~/Library/Caches/org.swift.swiftpm
```

**All safe to delete — Xcode regenerates everything:**
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf ~/Library/Developer/Xcode/UserData/IB\ Support
rm -rf ~/Library/Developer/Xcode/UserData/Previews
rm -rf ~/Library/Caches/org.swift.swiftpm
```

### Step 4: Simulator Runtimes (~10–25 GB)

```bash
xcrun simctl runtime list
```

Remove unused runtimes (e.g., watchOS if not developing for it):
```bash
xcrun simctl runtime delete <UUID>
# Or by name:
xcrun simctl runtime delete "watchOS 26.0"
```

Also clean up unavailable simulator devices:
```bash
xcrun simctl delete unavailable
```

### Step 5: Application Support / Claude VM

```bash
cd ~/Library && du -d1 "Application Support" 2>/dev/null | sort -rn | head -20
```

**Known large items:**
- `Application Support/Claude/vm_bundles/claudevm.bundle/rootfs.img` — Claude desktop VM image, can be 10+ GB. Safe to delete if not using computer use features; Claude recreates it.
- `Application Support/Google/` — Chrome profiles/cache
- `Application Support/Adobe/` — Creative Cloud data

### Step 6: macOS Update Artifacts

macOS beta updates in particular leave staged artifacts behind.

```bash
du -sh /Library/Updates/ 2>/dev/null
du -sh /System/Volumes/Preboot/Cryptexes/Incoming/ 2>/dev/null
du -sh /System/Volumes/Preboot/Cryptexes/OS/ 2>/dev/null
```

**Known offenders:**
- `/Library/Updates/` — Downloaded-but-not-installed update packages. Install the pending update to clear: `sudo softwareupdate --install --all`
- `Cryptexes/Incoming/` (~12 GB) — Staged macOS Cryptex update. **Do not delete manually.** A system restart triggers cleanup.
- `cryptex1/os.clone.dmg` — Left behind after a Cryptex update. Managed by macOS.

### Step 7: Root /Library Breakdown

```bash
du -d1 /Library/ 2>/dev/null | sort -rn | head -15
du -d1 /Library/Application\ Support/Adobe/ 2>/dev/null | sort -rn | head -10
```

**Known large items:**
- `/Library/Developer/CoreSimulator/` (~29 GB) — Simulator volumes and dyld caches. Remove via Xcode > Settings > Platforms.
- `/Library/Application Support/Adobe/` (~17 GB) — Adobe CC shared assets, Camera Raw profiles, lens profiles. Leave unless uninstalling Adobe apps.

### Step 8: Full Data Volume Breakdown (Last Resort)

If steps 1–7 don't explain the discrepancy, run a full top-level breakdown:

```bash
du -d1 /System/Volumes/Data/ 2>/dev/null | sort -rn | head -15
```

Then drill into any unexpectedly large directories.

---

## macOS "System Data" Category — What It Actually Includes

Apple's **System Data** bucket in Settings > General > Storage is intentionally opaque. It includes:

| Component | Typical Size | Notes |
|---|---|---|
| macOS system snapshot | ~12 GB | The OS itself — untouchable |
| Preboot volume | ~8–26 GB | Includes Cryptexes, dyld caches |
| VM/swap volume | ~7 GB | Managed by macOS |
| Recovery | ~1.3 GB | Untouchable |
| `/Library/Developer/CoreSimulator/` | ~25–35 GB | Simulator runtimes + dyld caches |
| `/System/Library/AssetsV2/` | ~10–15 GB | Simulator + Siri + Metal assets |
| `/private/var/` | ~15 GB | System databases, logs |
| APFS purgeable space | Variable | Cached data macOS can reclaim |

**Floor for a developer Mac with Xcode + iOS simulators:** ~90–110 GB "System Data" is normal. Anything above that warrants investigation.

---

## Common Culprits by Scenario

| Symptom | First Place to Check |
|---|---|
| Storage jumped suddenly | `/private/tmp/` — build tools leave artifacts |
| Storage grew after macOS update | `Cryptexes/Incoming/`, `/Library/Updates/` |
| Storage grew after Xcode session | `DerivedData`, `/tmp/OPS-*` build dirs |
| System category unexpectedly high | Simulator runtimes, CoreSimulator dyld caches |
| Can't identify source | Run full `du -d1 /System/Volumes/Data/` scan |

---

## Quick Cleanup Script

For a fast sweep of the safest, highest-yield items:

```bash
# Safe to run anytime — all regenerable
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf ~/Library/Developer/Xcode/UserData/IB\ Support
rm -rf ~/Library/Developer/Xcode/UserData/Previews
rm -rf ~/Library/Caches/org.swift.swiftpm
xcrun simctl delete unavailable

# Check /tmp manually before deleting
du -d1 /private/tmp 2>/dev/null | sort -rn | head -10
```

---

## Additional Resources

- **`references/investigation-log.md`** — Notes from the March 2026 investigation that built this skill, including the specific 50 GB case solved.
