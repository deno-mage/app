#!/bin/sh

# Get list of staged files that are supported by deno fmt
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|json|md|css)$')

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Run deno fmt on staged files only
deno fmt $STAGED_FILES

# Re-add the formatted files to the commit
for file in $STAGED_FILES; do
  git add "$file"
done
