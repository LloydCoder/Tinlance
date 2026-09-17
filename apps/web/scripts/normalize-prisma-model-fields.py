from __future__ import annotations

import re
import sys
from pathlib import Path

MODEL_SECTION = re.compile(r"(?m)(?=^model\s+\w+\s*\{$)")
FIELD = re.compile(r"^\s*(\w+)\s+")


def normalize_section(section: str) -> str:
    leading = section[: len(section) - len(section.lstrip("\n"))]
    body = section.lstrip("\n")
    lines = body.splitlines()
    if not lines or not lines[0].strip().startswith("model "):
        return section
    seen: set[str] = set()
    output = [lines[0]]
    for line in lines[1:]:
        stripped = line.strip()
        match = FIELD.match(line) if stripped and not stripped.startswith(("@@", "//")) else None
        if match:
            name = match.group(1)
            if name in seen:
                continue
            seen.add(name)
        output.append(line)
    return leading + "\n".join(output)


def normalize(text: str) -> str:
    sections = MODEL_SECTION.split(text)
    if len(sections) == 1:
        return text
    prefix = sections[0]
    models = [normalize_section(section) for section in sections[1:]]
    return prefix + "\n".join(models)


if len(sys.argv) != 2:
    raise SystemExit("usage: normalize-prisma-model-fields.py <schema>")

path = Path(sys.argv[1])
path.write_text(normalize(path.read_text(encoding="utf-8")).rstrip() + "\n", encoding="utf-8")
print("Normalized Prisma model fields")
