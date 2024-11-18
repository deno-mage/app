#!/bin/sh

deno task format --check
deno task lint
deno task check
