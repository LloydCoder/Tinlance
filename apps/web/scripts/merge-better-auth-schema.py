from __future__ import annotations

import re
import sys
from pathlib import Path

MODEL_START_RE = re.compile(r"^model\s+(\w+)\s*\{$")


def blocks(text: str):
    lines = text.splitlines()
    found = {}
    i = 0
    while i < len(lines):
        match = MODEL_START_RE.match(lines[i].strip())
        if not match:
            i += 1
            continue
        name = match.group(1)
        start = i
        depth = 0
        while i < len(lines):
            depth += lines[i].count("{") - lines[i].count("}")
            if depth == 0:
                found[name] = "\n".join(lines[start:i + 1])
                break
            i += 1
        i += 1
    return found


if len(sys.argv) < 3:
    raise SystemExit("usage: merge-better-auth-schema.py <generated> <target> [extra-model-file ...]")

source_paths = [Path(arg) for arg in sys.argv[1:-1]]
target_path = Path(sys.argv[-1])
result = target_path.read_text(encoding="utf-8").rstrip() + "\n"
existing_models = blocks(result)
added = []

for source_path in source_paths:
    for name, model_block in blocks(source_path.read_text(encoding="utf-8")).items():
        # Tinlance owns the existing Better Auth core relation graph. Plugin
        # models are appended only when they do not already exist.
        if name == "User" or name in existing_models:
            continue
        result = result.rstrip() + "\n\n" + model_block + "\n"
        existing_models[name] = model_block
        added.append(name)

target_path.write_text(result.rstrip() + "\n", encoding="utf-8")
print(f"Append-only Better Auth merge added: {', '.join(added) if added else 'none'}")
