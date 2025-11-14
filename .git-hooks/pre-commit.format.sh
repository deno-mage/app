#!/bin/sh

# Run deno format
deno task format

# Add any formatted files back to the staging area
git diff --name-only --cached | xargs git add
