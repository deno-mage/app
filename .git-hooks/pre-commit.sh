#!/bin/sh

execute_task() {
  deno task $1
  if [ $? -ne 0 ]; then
    echo "Task $1 failed"
    exit 1
  fi
}

execute_task format --check
execute_task lint
execute_task check
