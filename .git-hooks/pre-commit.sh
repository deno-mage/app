#!/bin/sh

deno fmt
deno lint --fix
git add -u

