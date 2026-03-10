# Storage Investigation Log — March 2026

## Context

macOS 26.3.1 beta, developer machine with Xcode, Adobe CC, iOS simulators. "System" storage reported as 148 GB (later 133 GB), user noted ~50 GB appeared in the last 2 weeks.

## What Was Found

### The Smoking Gun: /private/tmp (22 GB)

Two Xcode build directories placed in `/tmp` by a build script — not cleaned up because APFS does not flush `/tmp` until reboot:

- `/private/tmp/OPS-DerivedData` — 11 GB (Xcode DerivedData with SourcePackages)
- `/private/tmp/OPS-build` — 11 GB (near-identical duplicate)

**Both were last modified March 8, 2026.** Deleted immediately, 22 GB reclaimed.

**Key insight:** These were created by a custom build script that set `DERIVED_DATA_PATH=/tmp/OPS-DerivedData`. On Linux-style systems, `/tmp` gets cleared on reboot. On macOS with APFS, `/tmp` persists across sleep/wake cycles and only clears on a full reboot — so these can accumulate over days.

### macOS Beta Update Artifacts (~25 GB, unremovable)

Around Feb 24, a macOS beta update ran and left:

- `Cryptexes/Incoming/` — 12 GB, duplicate of `Cryptexes/OS/`. Staged for the next update. macOS cleans this on next restart after update is applied.
- `cryptex1/os.dmg` + `os.clone.dmg` — 12.6 GB, updated March 7. Clone left behind after Cryptex rotation. macOS-managed.
- `CoreSimulator/Caches/dyld/` — 6.3 GB, rebuilt March 7 when simulator runtimes were updated.

These cannot be safely deleted manually. A system restart typically triggers cleanup of `Incoming/`.

### Xcode Caches Cleaned (~35 GB)

After the /tmp cleanup, also swept standard Xcode caches:

- `DerivedData`: 15 GB → deleted
- `UserData/IB Support`: 7.5 GB → deleted
- `UserData/Previews`: 5.4 GB → deleted
- `Caches/org.swift.swiftpm`: 6.8 GB → deleted
- watchOS simulator runtime: ~11 GB → deleted via `xcrun simctl runtime delete`

**Total freed in session: ~47 GB**

## What Was NOT the Culprit

These were investigated and ruled out:
- Time Machine local snapshots — none present
- Docker — not installed
- iOS device backups — none present
- iCloud Drive cache — negligible (12 KB)
- Claude VM (`claudevm.bundle/rootfs.img`) — 10 GB but pre-existing, not recent

## Data Volume Breakdown (Final)

When `du -d1 /System/Volumes/Data/` was run, the top-level sizes were:
- `Users/`: 76 GB (home folders)
- `Library/`: 41 GB (root-level, includes CoreSimulator)
- `Applications/`: 37 GB (Adobe CC, Xcode, Microsoft Office)
- `private/`: 30 GB (22 GB was /tmp OPS artifacts, ~8 GB is /var)
- `System/`: 14 GB (AssetsV2 — simulator runtimes + Siri + Metal)
- `opt/`: 1.7 GB (Homebrew)

## Lessons Learned

1. **Check /private/tmp first.** It's the most likely source of sudden, unexplained storage growth on a dev machine.
2. **macOS beta updates leave Cryptex artifacts.** Restart clears them; don't try to manually delete.
3. **`du` on /System/Volumes/Preboot/Cryptexes/ will double-report.** Both `OS/` and `Incoming/` appear as 12 GB each, but they may be APFS COW clones — not necessarily double the actual storage.
4. **The macOS "System Data" floor for a dev Mac is ~90–110 GB.** Anything above that is worth investigating.
