#!/bin/sh

# Run deno format
deno task format

# Add formatted files back to staging only if there are any
# Use git update-index instead of git add to avoid index lock conflicts
STAGED_FILES=$(git diff --name-only --cached --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|json)$')
if [ -n "$STAGED_FILES" ]; then
    echo "$STAGED_FILES" | xargs git add
fi
