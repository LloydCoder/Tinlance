import { createHash, randomBytes } from "node:crypto";

export function createProposalToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashProposalToken(token) };
}

export function hashProposalToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
