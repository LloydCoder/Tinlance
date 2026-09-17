from __future__ import annotations

import re
import sys
from pathlib import Path

MODEL_START = re.compile(r"^model\s+(\w+)\s*\{$")
FIELD = re.compile(r"^\s*(\w+)\s+")


def normalize(text: str) -> str:
    lines = text.splitlines()
    out: list[str] = []
    i = 0
    while i < len(lines):
        if not MODEL_START.match(lines[i].strip()):
            out.append(lines[i])
            i += 1
            continue

        depth = 0
        seen: set[str] = set()
        while i < len(lines):
            line = lines[i]
            depth += line.count("{") - line.count("}")
            match = FIELD.match(line) if line.strip() and not line.strip().startswith(("@@", "//")) else None
            if match:
                name = match.group(1)
                if name in seen:
                    i += 1
                    continue
                seen.add(name)
            out.append(line)
            i += 1
            if depth == 0:
                break
    return "\n".join(out).rstrip() + "\n"


if len(sys.argv) != 2:
    raise SystemExit("usage: normalize-prisma-model-fields.py <schema>")

path = Path(sys.argv[1])
original = path.read_text(encoding="utf-8")
normalized = normalize(original)
path.write_text(normalized, encoding="utf-8")
print("Normalized Prisma model fields")
