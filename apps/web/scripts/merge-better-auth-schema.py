from __future__ import annotations

import re
import sys
from pathlib import Path


MODEL_RE = re.compile(r"(?ms)^model\s+(\w+)\s*\{.*?^\}\s*$")
FIELD_RE = re.compile(r"^\s*(\w+)\s+")


def blocks(text: str):
    return {m.group(1): m.group(0) for m in MODEL_RE.finditer(text)}


def field_names(model_block: str):
    names = set()
    for line in model_block.splitlines()[1:-1]:
        stripped = line.strip()
        if not stripped or stripped.startswith(("@@", "//")):
            continue
        match = FIELD_RE.match(line)
        if match:
            names.add(match.group(1))
    return names


def generated_field_lines(model_block: str):
    seen = set()
    for line in model_block.splitlines()[1:-1]:
        stripped = line.strip()
        if not stripped or stripped.startswith(("@@", "//")):
            continue
        match = FIELD_RE.match(line)
        if not match:
            continue
        name = match.group(1)
        if name in seen:
            continue
        seen.add(name)
        yield line


def merge_model(existing: str, generated: str) -> str:
    existing_names = field_names(existing)
    missing = []
    seen = set(existing_names)
    for line in generated_field_lines(generated):
        name = FIELD_RE.match(line).group(1)
        if name in seen:
            continue
        seen.add(name)
        missing.append(line)
    if not missing:
        return existing
    lines = existing.splitlines()
    closing = len(lines) - 1
    insertion = ["", "  // Better Auth Gate A generated fields"] + [f"  {line.strip()}" for line in missing]
    lines[closing:closing] = insertion
    return "\n".join(lines)


def merge(base: str, generated: str) -> str:
    generated_models = blocks(generated)
    existing_models = blocks(base)
    result = base
    for name, generated_block in generated_models.items():
        if name in existing_models:
            original = existing_models[name]
            updated = merge_model(original, generated_block)
            if updated != original:
                result = result.replace(original, updated, 1)
        else:
            result = result.rstrip() + "\n\n" + generated_block + "\n"
    return result


if len(sys.argv) != 3:
    raise SystemExit("usage: merge-better-auth-schema.py <generated> <target>")

generated_path = Path(sys.argv[1])
target_path = Path(sys.argv[2])
generated = generated_path.read_text(encoding="utf-8")
target = target_path.read_text(encoding="utf-8")
merged = merge(target, generated)
target_path.write_text(merged.rstrip() + "\n", encoding="utf-8")
print(f"Merged Better Auth models from {generated_path} into {target_path}")
