import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const repoRoot = path.resolve(root, "../..");
const capabilities = JSON.parse(fs.readFileSync(path.join(root, "content/capabilities.json"), "utf8"));
const evidence = JSON.parse(fs.readFileSync(path.join(root, "content/evidence-registry.json"), "utf8"));
const claims = JSON.parse(fs.readFileSync(path.join(root, "content/claim-registry.json"), "utf8"));
const errors = []; const warnings = [];
const evidenceById = new Map(evidence.evidence.map((item) => [item.id, item]));
const capabilityBySlug = new Map(capabilities.capabilities.map((item) => [item.slug, item]));
function sourceExists(repositoryPath) { return fs.existsSync(path.join(repoRoot, repositoryPath)); }
for (const capability of capabilities.capabilities) {
  if (!capability.slug || !capability.id || !capability.status || !capability.maturity || !capability.availability) errors.push(`Capability ${capability.id} is missing authoritative status fields.`);
  if (capability.repository === "LloydCoder/Tinlance" && !sourceExists(capability.repositoryPath)) errors.push(`Capability ${capability.slug} points at a missing repository path: ${capability.repositoryPath}`);
  if (capability.commerciallyAvailable && capability.evidenceIds.length === 0) errors.push(`Commercial capability ${capability.slug} has no evidence.`);
  for (const evidenceId of capability.evidenceIds) if (!evidenceById.has(evidenceId)) errors.push(`Capability ${capability.slug} references missing evidence ${evidenceId}.`);
  if (capability.maturity === "VALIDATED" && capability.evidenceIds.length === 0) errors.push(`Validated capability ${capability.slug} has no evidence.`);
}
for (const item of evidence.evidence) {
  if (!capabilityBySlug.has(item.capabilitySlug)) errors.push(`Evidence ${item.id} references unknown capability ${item.capabilitySlug}.`);
  if (!item.commit || !item.status || !item.scope || !item.limitations) errors.push(`Evidence ${item.id} is missing provenance/status/scope/limitations.`);
  if (item.repository === "LloydCoder/Tinlance" && !sourceExists(item.path)) errors.push(`Evidence ${item.id} points at a missing repository path: ${item.path}`);
}
for (const claim of claims.claims) {
  if (!claim.id || !claim.claimClass || !claim.status || !claim.scope || !claim.limitations) errors.push(`Claim ${claim.id} is incomplete.`);
  if (claim.capability && !capabilityBySlug.has(claim.capability)) errors.push(`Claim ${claim.id} references unknown capability ${claim.capability}.`);
  for (const evidenceId of claim.evidence) if (!evidenceById.has(evidenceId)) errors.push(`Claim ${claim.id} references missing evidence ${evidenceId}.`);
  if (claim.critical && claim.status !== "PASS") errors.push(`Critical claim ${claim.id} is not PASS.`);
  if (claim.claimClass === "COMPLIANCE" && claim.status === "PASS" && claim.evidence.length === 0 && /certif|compliant/i.test(claim.text) && !/does not claim|without/i.test(claim.text)) errors.push(`Compliance claim ${claim.id} requires explicit verified compliance evidence.`);
}
const base = process.env.BASE_SHA;
if (base) {
  try {
    const changed = execFileSync("git", ["-C", repoRoot, "diff", "--name-only", base, "HEAD"], { encoding: "utf8" }).split("\n").filter(Boolean);
    for (const item of evidence.evidence) if (item.repository === "LloydCoder/Tinlance" && item.status === "ACTIVE" && changed.some((file) => file === item.path || file.startsWith(`${item.path}/`))) warnings.push(`Evidence ${item.id} is scoped to changed code; re-run verification against the new commit before treating it as current.`);
  } catch (error) { warnings.push(`Could not compute scoped evidence drift from ${base}: ${error instanceof Error ? error.message : String(error)}`); }
}
if (errors.length) { console.error("Claim verification FAILED"); for (const error of errors) console.error(`- ${error}`); process.exit(1); }
console.log(`Claim verification PASS: ${claims.claims.length} claims, ${capabilities.capabilities.length} capabilities, ${evidence.evidence.length} evidence records.`);
for (const warning of warnings) console.warn(`WARN: ${warning}`);
