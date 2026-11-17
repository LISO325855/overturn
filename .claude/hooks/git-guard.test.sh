#!/usr/bin/env bash
# The guard is a wall, and an untested wall is a wish with extra steps.
# Run: bash .claude/hooks/git-guard.test.sh
set -uo pipefail
cd "$(dirname "$0")/../.."
GUARD=.claude/hooks/git-guard.sh
pass=0; fail=0

check() { # check <expected-exit> <command>
  local want="$1" cmd="$2" got
  printf '{"tool_input":{"command":%s}}' "$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$cmd")" \
    | bash "$GUARD" >/dev/null 2>&1
  got=$?
  if [ "$got" = "$want" ]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1)); echo "FAIL expected $want got $got: $cmd"
  fi
}

# 2 = blocked. The first of these is the exact command that got past the settings.json
# prefix rule on 2026-11-16, because -q sat between "git push" and "--force-with-lease".
check 2 "git push -q --force-with-lease origin agent/x"
check 2 "git push --force origin agent/x"
check 2 "git push -f origin agent/x"
check 2 "git push --force-if-includes origin x"
check 2 "echo hi && git push --force origin x"
check 2 "git -c user.name=X push --force origin x"
check 2 "gh pr merge 82 --squash"
check 2 "git merge origin/main"
check 2 "git reset --hard origin/main"

# 0 = allowed. A guard that blocks ordinary work gets switched off, which is worse than no guard.
check 0 "git push -u origin agent/x"
check 0 "git push origin main"
check 0 "git merge feature-branch"
check 0 "git commit -m 'fix: force the issue'"
check 0 "git log --format=%s | grep force"
check 0 "pnpm test -- --force"
check 0 "pnpm lint"
check 0 "rg 'force' docs/"

echo "git-guard: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
