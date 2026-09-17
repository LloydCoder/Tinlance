from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
start = text.find("model User {")
if start < 0:
    raise SystemExit("model User not found")
end = text.find("\nmodel ", start + 1)
if end < 0:
    end = len(text)
block = text[start:end]
lines = block.splitlines()
seen = set()
out = [lines[0]]
for line in lines[1:]:
    stripped = line.strip()
    match = re.match(r"^(\w+)\s+", stripped) if stripped and not stripped.startswith(("@@", "//")) else None
    if match:
        name = match.group(1)
        if name in seen:
            continue
        seen.add(name)
    out.append(line)
new_block = "\n".join(out)
path.write_text(text[:start] + new_block + text[end:], encoding="utf-8")
print("Normalized User model relations")
