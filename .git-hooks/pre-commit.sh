#!/bin/sh

deno fmt
git add -u

deno lint
