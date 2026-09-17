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
if re.search(r"^\s*twoFactorEnabled\s+Boolean\b", block, re.MULTILINE):
    print("User.twoFactorEnabled already present")
    raise SystemExit(0)
lines = block.splitlines()
insert_at = next((i for i, line in enumerate(lines) if line.strip().startswith("role ")), len(lines) - 1)
lines.insert(insert_at + 1, "  twoFactorEnabled Boolean @default(false)")
new_block = "\n".join(lines)
path.write_text(text[:start] + new_block + text[end:], encoding="utf-8")
print("Added User.twoFactorEnabled")
