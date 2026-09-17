from __future__ import annotations

import re
import sys
from pathlib import Path


MODEL_START_RE = re.compile(r"^model\s+(\w+)\s*\{$")
FIELD_RE = re.compile(r"^\s*(\w+)\s+")


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
    seen = set(field_names(existing))
    missing = []
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


def normalize_model_block(model_block: str) -> str:
    lines = model_block.splitlines()
    seen = set()
    output = [lines[0]]
    for line in lines[1:-1]:
        match = FIELD_RE.match(line) if line.strip() and not line.strip().startswith(("@@", "//")) else None
        if match:
            name = match.group(1)
            if name in seen:
                continue
            seen.add(name)
        output.append(line)
    output.append(lines[-1])
    return "\n".join(output)


def normalize(text: str) -> str:
    result = text
    for model_block in list(blocks(text).values()):
        normalized = normalize_model_block(model_block)
        if normalized != model_block:
            result = result.replace(model_block, normalized, 1)
    return result


def merge(base: str, *sources: str) -> str:
    result = base
    existing_models = blocks(base)
    for source in sources:
        for name, source_block in blocks(source).items():
            if name in existing_models:
                original = existing_models[name]
                updated = merge_model(original, source_block)
                if updated != original:
                    result = result.replace(original, updated, 1)
                    existing_models[name] = updated
            else:
                result = result.rstrip() + "\n\n" + source_block + "\n"
                existing_models[name] = source_block
    return normalize(result)


if len(sys.argv) < 3:
    raise SystemExit("usage: merge-better-auth-schema.py <generated> <target> [extra-model-file ...]")

source_paths = [Path(arg) for arg in sys.argv[1:-1]]
target_path = Path(sys.argv[-1])
source_texts = [path.read_text(encoding="utf-8") for path in source_paths]
target = target_path.read_text(encoding="utf-8")
merged = merge(target, *source_texts)
target_path.write_text(merged.rstrip() + "\n", encoding="utf-8")
print(f"Merged {len(source_paths)} Prisma model sources into {target_path}")
