from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
match = re.search(r"(?ms)^model User \{.*?^\}", text)
if not match:
    raise SystemExit("model User not found")
block = match.group(0)
lines = block.splitlines()
out = [lines[0]]
seen_invitations = False
has_mfa = False
for line in lines[1:-1]:
    stripped = line.strip()
    field = re.match(r"^(\w+)\s+", stripped) if stripped and not stripped.startswith(("@@", "//")) else None
    if field and field.group(1) == "invitations":
        if seen_invitations:
            continue
        seen_invitations = True
    if field and field.group(1) == "twoFactorEnabled":
        has_mfa = True
    out.append(line)
out.append(lines[-1])
if not has_mfa:
    insert_at = next((i for i, line in enumerate(out) if line.strip().startswith("role ")), len(out) - 1)
    out.insert(insert_at + 1, "  twoFactorEnabled Boolean @default(false)")
new_block = "\n".join(out)
path.write_text(text[:match.start()] + new_block + text[match.end():], encoding="utf-8")
print("Normalized User invitation relation and MFA field")
