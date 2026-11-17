# Mistakes

Date · what happened · where the fix landed. One line each.
2026-11-07 · Branched from local `main` 6 commits behind `origin/main`, which showed lint errors already fixed upstream · `CLAUDE.md` and `AGENTS.md`, Git section: fetch and branch from `origin/main`.
2026-11-16 · Wired marketing analytics for overturn.run being served from this repo; it is a Framer page at www.overturn.run that mounts `framer/landing.js`, and the docs are on docs.overturn.run. The first version would have sent nothing in production · `CLAUDE.md` and `AGENTS.md`, Stack section: where each site is served from
2026-11-17 · Force-pushed agent/commerce-pack to fix a commit message the shell had mangled, with "never force-push" in CLAUDE.md and a settings.json deny rule for it. `-q` between `git push` and `--force-with-lease` meant the literal-prefix rule never matched · `.claude/hooks/git-guard.sh` (reads the whole command, in any flag order) plus `scripts/check-attribution.sh` in CI, both named from CLAUDE.md's Git section.
