from __future__ import annotations

import re
import sys
from pathlib import Path


def blocks(text: str):
    pattern = re.compile(r"(?ms)^model\s+(\w+)\s*\{.*?^\}\s*$")
    return {m.group(1): m.group(0) for m in pattern.finditer(text)}


def field_names(model_block: str):
    names = set()
    for line in model_block.splitlines()[1:-1]:
        stripped = line.strip()
        if not stripped or stripped.startswith("@@") or stripped.startswith("//"):
            continue
        match = re.match(r"^(\w+)\s+", stripped)
        if match:
            names.add(match.group(1))
    return names


def field_lines(model_block: str):
    return model_block.splitlines()[1:-1]


def merge_model(existing: str, generated: str) -> str:
    existing_names = field_names(existing)
    generated_names = field_names(generated)
    missing = [line for line in field_lines(generated) if line.strip() and not line.strip().startswith(("@@", "//")) and re.match(r"^\s*(\w+)\s+", line) and re.match(r"^\s*(\w+)\s+", line).group(1) not in existing_names]
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
    # Merge fields into existing Better Auth core/plugin models without touching Tinlance business relations.
    for name, generated_block in generated_models.items():
        if name in existing_models:
            updated = merge_model(result[0:0] + existing_models[name], generated_block)
            if updated != existing_models[name]:
                result = result.replace(existing_models[name], updated, 1)
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
