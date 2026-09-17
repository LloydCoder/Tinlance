from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
match = re.search(r"(?ms)^model User \{.*?^\}", text)
if not match:
    raise SystemExit("model User not found")
block = match.group(0)

# The existing Tinlance User relation graph is authoritative. Keep exactly
# one invitations relation and add only the Better Auth MFA scalar.
invitation_matches = list(re.finditer(r"(?m)^\s*invitations\s+Invitation\[\].*\n", block))
if len(invitation_matches) > 1:
    for duplicate in reversed(invitation_matches[1:]):
        block = block[:duplicate.start()] + block[duplicate.end():]

if not re.search(r"(?m)^\s*twoFactorEnabled\s+Boolean\b", block):
    lines = block.splitlines()
    insert_at = next((i for i, line in enumerate(lines) if line.strip().startswith("role ")), len(lines) - 1)
    lines.insert(insert_at + 1, "  twoFactorEnabled Boolean @default(false)")
    block = "\n".join(lines)

path.write_text(text[:match.start()] + block + text[match.end():], encoding="utf-8")
print("Normalized User invitation relation and MFA field")
