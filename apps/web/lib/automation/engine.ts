import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { generateAssessmentReport } from "@/lib/workspace/report";

export type AutomationStatus = "PENDING" | "RUNNING" | "WAITING" | "PAUSED" | "WAITING_FOR_APPROVAL" | "RETRYING" | "COMPLETED" | "FAILED" | "CANCELLED" | "EXPIRED";
export type StepStatus = "PENDING" | "RUNNING" | "WAITING" | "PAUSED" | "WAITING_FOR_APPROVAL" | "RETRYING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type StepType = "SYSTEM" | "FDE" | "APPROVAL" | "CUSTOMER_INPUT";

type DefinitionStep = { key: string; type: StepType; domain?: string; capabilityId?: string; capabilityVersion?: string; policy?: string; retry?: { maxAttempts?: number; backoffSeconds?: number }; timeoutSeconds?: number };
type Definition = { maxDurationSeconds: number; maxSteps: number; steps: DefinitionStep[]; policies: { dryRun: boolean; externalWritesRequireApproval: boolean; customerDataUntrusted: boolean } };
type RunRow = { id: string; organization_id: string; project_id: string; assessment_id: string | null; playbook_id: string; playbook_version_id: string; status: AutomationStatus; trigger_type: string; initiating_actor_user_id: string | null; request_id: string; current_step: number; state: Record<string, unknown>; result: Record<string, unknown> | null; error_code: string | null; error_message: string | null };
type StepRow = { id: string; workflow_run_id: string; step_key: string; ordinal: number; step_type: StepType; status: StepStatus; input: Record<string, unknown>; output: Record<string, unknown> | null; capability_id: string | null; capability_version: string | null; required_approval: boolean; authorization_decision: string | null };

const FDE_API_URL = process.env.FDE_API_URL ?? process.env.NEXT_PUBLIC_FDE_API_URL ?? "";
const FDE_SERVICE_TOKEN = process.env.FDE_SERVICE_TOKEN ?? "";

function json(value: unknown) { return JSON.stringify(value ?? {}); }
function hash(value: unknown) { return createHash("sha256").update(json(value)).digest("hex"); }
function now() { return new Date(); }

async function appendEvent(tx: Prisma.TransactionClient, run: RunRow, eventType: string, payload: unknown, stepKey?: string, actorType = "system", actorId?: string) {
  await tx.$executeRaw(Prisma.sql`INSERT INTO "automation_workflow_events" ("workflow_run_id","organization_id","event_type","step_key","actor_type","actor_id","request_id","payload") VALUES (${run.id},${run.organization_id},${eventType},${stepKey ?? null},${actorType},${actorId ?? null},${run.request_id},${json(payload)}::jsonb)`);
}

async function audit(tx: Prisma.TransactionClient, run: RunRow, action: string, metadata: unknown, actorId?: string) {
  await tx.$executeRaw(Prisma.sql`INSERT INTO "AuditEvent" ("id","organizationId","actorUserId","action","resourceType","resourceId","requestId","metadata") VALUES (${randomUUID()},${run.organization_id},${actorId ?? run.initiating_actor_user_id},${action},'WorkflowRun',${run.id},${run.request_id},${json(metadata)}::jsonb)`);
}

export async function startAutomation(input: { organizationId: string; projectId: string; assessmentId?: string; playbookSlug: string; actorUserId: string; triggerType: string; idempotencyKey: string; requestId: string; input: Record<string, unknown> }) {
  if (!input.idempotencyKey || input.idempotencyKey.length > 255) throw new Error("invalid idempotency key");
  const existing = await db.$queryRaw<RunRow[]>(Prisma.sql`SELECT * FROM "automation_workflow_runs" WHERE "organization_id"=${input.organizationId} AND "idempotency_key"=${input.idempotencyKey} LIMIT 1`);
  if (existing[0]) return existing[0];
  const versions = await db.$queryRaw<Array<{ playbook_id: string; playbook_version_id: string; definition: Definition; version: string }>>(Prisma.sql`SELECT p.id AS playbook_id, v.id AS playbook_version_id, v.definition, v.version FROM "automation_playbooks" p JOIN "automation_playbook_versions" v ON v.playbook_id=p.id WHERE (p."organization_id" IS NULL OR p."organization_id"=${input.organizationId}) AND p.slug=${input.playbookSlug} AND p.status='ACTIVE' ORDER BY (p."organization_id" IS NULL) ASC, v."active_at" DESC LIMIT 1`);
  const version = versions[0]; if (!version) throw new Error("playbook not available");
  const project = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM "Project" WHERE id=${input.projectId} AND "organizationId"=${input.organizationId} LIMIT 1`);
  if (!project[0]) throw new Error("project not found");
  if (input.assessmentId) {
    const assessment = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM "Assessment" WHERE id=${input.assessmentId} AND "organizationId"=${input.organizationId} LIMIT 1`);
    if (!assessment[0]) throw new Error("assessment not found");
  }
  const runId = randomUUID();
  const steps = version.definition.steps.slice(0, version.definition.maxSteps);
  try {
    await db.$transaction(async tx => {
      await tx.$executeRaw(Prisma.sql`INSERT INTO "automation_workflow_runs" ("id","organization_id","project_id","assessment_id","playbook_id","playbook_version_id","status","trigger_type","initiating_actor_user_id","request_id","idempotency_key","state","started_at") VALUES (${runId},${input.organizationId},${input.projectId},${input.assessmentId ?? null},${version.playbook_id},${version.playbook_version_id},'RUNNING',${input.triggerType},${input.actorUserId},${input.requestId},${input.idempotencyKey},${json(input.input)}::jsonb,${now()})`);
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await tx.$executeRaw(Prisma.sql`INSERT INTO "automation_workflow_steps" ("id","workflow_run_id","step_key","ordinal","step_type","capability_id","capability_version","required_approval","input") VALUES (${randomUUID()},${runId},${step.key},${i},${step.type},${step.capabilityId ?? null},${step.capabilityVersion ?? null},${step.type === "APPROVAL"},'{}'::jsonb)`);
      }
      const run = { id: runId, organization_id: input.organizationId, project_id: input.projectId, assessment_id: input.assessmentId ?? null, playbook_id: version.playbook_id, playbook_version_id: version.playbook_version_id, request_id: input.requestId, initiating_actor_user_id: input.actorUserId } as RunRow;
      await appendEvent(tx, run, "WORKFLOW_STARTED", { playbook: input.playbookSlug, version: version.version, triggerType: input.triggerType });
      await audit(tx, run, "WORKFLOW_STARTED", { playbook: input.playbookSlug, version: version.version }, input.actorUserId);
    });
  } catch (error) {
    const duplicate = await db.$queryRaw<RunRow[]>(Prisma.sql`SELECT * FROM "automation_workflow_runs" WHERE "organization_id"=${input.organizationId} AND "idempotency_key"=${input.idempotencyKey} LIMIT 1`);
    if (duplicate[0]) return duplicate[0];
    throw error;
  }
  return (await db.$queryRaw<RunRow[]>(Prisma.sql`SELECT * FROM "automation_workflow_runs" WHERE id=${runId}`))[0];
}

async function loadDefinition(run: RunRow): Promise<Definition> {
  const rows = await db.$queryRaw<Array<{ definition: Definition }>>(Prisma.sql`SELECT definition FROM "automation_playbook_versions" WHERE id=${run.playbook_version_id}`);
  if (!rows[0]) throw new Error("workflow definition missing");
  return rows[0].definition;
}

async function fdeExecute(run: RunRow, step: StepRow, state: Record<string, unknown>, definitionStep: DefinitionStep) {
  if (!FDE_API_URL || !FDE_SERVICE_TOKEN) throw new Error("FDE gateway is not configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), (definitionStep.timeoutSeconds ?? 120) * 1000);
  try {
    const payload = { scope: state.scope ?? {}, context: state.context ?? {}, parameters: state.parameters ?? {}, workflowRunId: run.id, workflowStepId: step.id, capabilityId: definitionStep.capabilityId, capabilityVersion: definitionStep.capabilityVersion };
    const response = await fetch(`${FDE_API_URL.replace(/\/$/, "")}/v1/${definitionStep.domain ?? "cybersecurity"}/execute`, { method: "POST", signal: controller.signal, headers: { "content-type": "application/json", authorization: `Bearer ${FDE_SERVICE_TOKEN}`, "x-request-id": run.request_id, "Idempotency-Key": `${run.id}:${step.step_key}` }, body: JSON.stringify({ tenant_id: run.organization_id, payload }) });
    const body = await response.json().catch(() => null);
    if (!response.ok) { const error = new Error(typeof body?.detail === "string" ? body.detail : `FDE gateway returned ${response.status}`); (error as Error & { retryable?: boolean }).retryable = response.status === 429 || response.status >= 500; throw error; }
    return body;
  } finally { clearTimeout(timeout); }
}

function extractFindings(result: Record<string, unknown>) {
  const candidates = [result.findings, result.issues, result.vulnerabilities, (result.result as Record<string, unknown> | undefined)?.findings];
  const raw = candidates.find(Array.isArray) as unknown[] | undefined;
  return (raw ?? []).slice(0, 100).map((item, index) => {
    const value = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const severity = String(value.severity ?? "MEDIUM").toUpperCase();
    return { title: String(value.title ?? value.name ?? `Automated finding ${index + 1}`), description: String(value.description ?? value.summary ?? "Finding produced by the FDE Mastery capability."), category: String(value.category ?? "FDE"), severity: ["CRITICAL","HIGH","MEDIUM","LOW","INFO"].includes(severity) ? severity : "MEDIUM", recommendation: String(value.recommendation ?? value.remediation ?? "Review and remediate the identified condition."), affectedAsset: value.affectedAsset ? String(value.affectedAsset) : null };
  });
}

async function executeStep(run: RunRow, step: StepRow, definitionStep: DefinitionStep) {
  const state = run.state ?? {};
  if (step.step_type === "FDE") return fdeExecute(run, step, state, definitionStep);
  if (step.step_type === "APPROVAL") return { approved: true };
  if (step.step_key === "validate_scope") { if (!state.scope || typeof state.scope !== "object") throw new Error("assessment scope is required"); return { validated: true }; }
  if (step.step_key === "persist_result") return { persisted: true };
  if (step.step_key === "generate_findings") return { findings: extractFindings((state.fdeResult as Record<string, unknown>) ?? {}) };
  if (step.step_key === "request_evidence") return state.customerEvidenceId ? { evidenceId: String(state.customerEvidenceId) } : { waitingForInput: true };
  if (step.step_key === "draft_report") return { drafted: true };
  if (step.step_key === "publish_report") return { published: true };
  if (step.step_key === "create_remediation") return { remediationCreated: true };
  if (step.step_key === "verification") return state.verificationEvidenceId && state.verificationResult ? { verified: true, evidenceId: String(state.verificationEvidenceId), result: String(state.verificationResult) } : { waitingForInput: true };
  if (step.step_key === "close") return { closed: true };
  if (step.step_key === "schedule_reassessment") return { scheduled: true };
  return {};
}

async function persistStepOutcome(tx: Prisma.TransactionClient, run: RunRow, step: StepRow, output: Record<string, unknown>, definitionStep: DefinitionStep) {
  if (step.step_key === "execute_fde") {
    await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET state=state || ${json({ fdeResult: output })}::jsonb,"next_run_at"=NULL,"updated_at"=${now()} WHERE id=${run.id}`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "automation_artifacts" ("id","workflow_run_id","step_id","organization_id","project_id","type","resource_type","resource_id","provenance","content_hash") VALUES (${randomUUID()},${run.id},${step.id},${run.organization_id},${run.project_id},'FDE_EXECUTION','FDE_CAPABILITY',${definitionStep.capabilityId ?? null},${json({ capabilityId: definitionStep.capabilityId, capabilityVersion: definitionStep.capabilityVersion, domain: definitionStep.domain, requestId: run.request_id })}::jsonb,${hash(output)})`);
  }
  if (step.step_key === "generate_findings") {
    const findings = Array.isArray(output.findings) ? output.findings : [];
    for (let i = 0; i < findings.length; i++) {
      const f = findings[i] as Record<string, unknown>;
      const idempotency = `${run.id}:finding:${i}:${hash(f).slice(0,16)}`;
      await tx.$executeRaw(Prisma.sql`INSERT INTO "WorkspaceFinding" ("id","organizationId","projectId","assessmentId","title","description","category","severity","status","recommendation","visibility","authorship","idempotencyKey") VALUES (${randomUUID()},${run.organization_id},${run.project_id},${run.assessment_id ?? ""},${String(f.title)},${String(f.description)},${String(f.category)},${String(f.severity)},'DRAFT_INTERNAL',${String(f.recommendation)},'TINLANCE_INTERNAL','AI_ASSISTED',${idempotency}) ON CONFLICT ("idempotencyKey") DO NOTHING`);
    }
    await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET state=state || ${json({ findings })}::jsonb,"updated_at"=${now()} WHERE id=${run.id}`);
  }
  if (step.step_key === "request_evidence") {
    const existing = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM "WorkspaceEvidenceRequest" WHERE "organizationId"=${run.organization_id} AND "projectId"=${run.project_id} AND title='M4 automated assessment evidence' AND status IN ('REQUESTED','SUBMITTED','REOPENED') LIMIT 1`);
    if (!existing[0]) await tx.$executeRaw(Prisma.sql`INSERT INTO "WorkspaceEvidenceRequest" ("id","organizationId","projectId","assessmentId","title","description","requestedType","requestedByUserId") VALUES (${randomUUID()},${run.organization_id},${run.project_id},${run.assessment_id ?? null},'M4 automated assessment evidence','Provide supporting evidence required to validate the automated assessment output.','assessment-evidence',${run.initiating_actor_user_id})`);
  }
  if (step.step_key === "draft_report") {
    const findings = await tx.$queryRaw<Array<{ id: string; title: string; description: string; severity: string; category: string; affectedAsset: string | null; recommendation: string }>>(Prisma.sql`SELECT id,title,description,severity,category,"affectedAsset",recommendation FROM "WorkspaceFinding" WHERE "organizationId"=${run.organization_id} AND "projectId"=${run.project_id} AND "assessmentId"=${run.assessment_id ?? ""} ORDER BY "createdAt"`);
    const evidence = await tx.$queryRaw<Array<{ id: string; title: string; contentHash: string; type: string }>>(Prisma.sql`SELECT id,title,"contentHash",type FROM "WorkspaceEvidence" WHERE "organizationId"=${run.organization_id} AND "projectId"=${run.project_id} ORDER BY "createdAt"`);
    const remediation = await tx.$queryRaw<Array<{ findingId: string; title: string; status: string; priority: string }>>(Prisma.sql`SELECT "findingId",title,status,priority FROM "WorkspaceRemediation" WHERE "organizationId"=${run.organization_id} AND "projectId"=${run.project_id} ORDER BY "createdAt"`);
    const report = generateAssessmentReport({ title: "FDE Automated Technical Assessment", projectName: run.project_id, assessmentType: "FDE Technical Assessment", assessmentPeriod: new Date().toISOString(), objective: "Automated assessment executed through the canonical Tinlance FDE API boundary.", methodology: "Validated scope → FDE Mastery triage → structured finding normalization → evidence traceability → human review.", findings, evidence, remediation, limitations: "Automation output is not a certification; consequential publication remains human-controlled." });
    const reportId = randomUUID();
    await tx.$executeRaw(Prisma.sql`INSERT INTO "WorkspaceReport" ("id","organizationId","projectId","assessmentId","title","type","currentVersion","status","summary","generatedAt","contentHash","idempotencyKey") VALUES (${reportId},${run.organization_id},${run.project_id},${run.assessment_id ?? null},'FDE Automated Technical Assessment','AUTOMATED_FDE',1,'DRAFT','Draft generated by M4 automation.',${now()},${report.contentHash},${`${run.id}:report`}) ON CONFLICT ("idempotencyKey") DO NOTHING`);
    const reportRows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM "WorkspaceReport" WHERE "idempotencyKey"=${`${run.id}:report`} LIMIT 1`);
    const finalReportId = reportRows[0]?.id ?? reportId;
    await tx.$executeRaw(Prisma.sql`INSERT INTO "WorkspaceReportVersion" ("id","reportId","version","content","contentHash","createdByUserId") VALUES (${randomUUID()},${finalReportId},1,${report.content},${report.contentHash},${run.initiating_actor_user_id}) ON CONFLICT ("reportId","version") DO NOTHING`);
    await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET state=state || ${json({ reportId: finalReportId })}::jsonb,"updated_at"=${now()} WHERE id=${run.id}`);
  }
  if (step.step_key === "publish_report") {
    const reportId = stateValue(run, "reportId");
    if (typeof reportId === "string") await tx.$executeRaw(Prisma.sql`UPDATE "WorkspaceReport" SET status='PUBLISHED',"publishedAt"=${now()},"publishedByUserId"=${run.initiating_actor_user_id},"updatedAt"=${now()} WHERE id=${reportId} AND "organizationId"=${run.organization_id}`);
  }
  if (step.step_key === "create_remediation") {
    const findings = await tx.$queryRaw<Array<{ id: string; title: string; recommendation: string; severity: string }>>(Prisma.sql`SELECT id,title,recommendation,severity FROM "WorkspaceFinding" WHERE "organizationId"=${run.organization_id} AND "projectId"=${run.project_id} AND "assessmentId"=${run.assessment_id ?? ""}`);
    for (const finding of findings) await tx.$executeRaw(Prisma.sql`INSERT INTO "WorkspaceRemediation" ("id","organizationId","projectId","findingId","title","description","priority","status","idempotencyKey") VALUES (${randomUUID()},${run.organization_id},${run.project_id},${finding.id},${`Remediate: ${finding.title}`},${finding.recommendation},${finding.severity},'OPEN',${`${run.id}:remediation:${finding.id}`}) ON CONFLICT ("idempotencyKey") DO NOTHING`);
  }
  if (step.step_key === "verification") {
    const evidenceId = String(output.evidenceId ?? "");
    const result = String(output.result ?? "INCONCLUSIVE").toUpperCase();
    const remediations = await tx.$queryRaw<Array<{ id: string; findingId: string }>>(Prisma.sql`SELECT id,"findingId" FROM "WorkspaceRemediation" WHERE "organizationId"=${run.organization_id} AND "projectId"=${run.project_id} AND status IN ('OPEN','IN_PROGRESS','READY_FOR_VERIFICATION')`);
    for (const remediation of remediations) {
      await tx.$executeRaw(Prisma.sql`INSERT INTO "WorkspaceVerification" ("id","organizationId","projectId","findingId","remediationId","verifierUserId","method","result","notes","evidenceId") VALUES (${randomUUID()},${run.organization_id},${run.project_id},${remediation.findingId},${remediation.id},${run.initiating_actor_user_id},'M4 workflow verification',${result},'Verification supplied through the controlled workflow input.',${evidenceId || null})`);
      await tx.$executeRaw(Prisma.sql`UPDATE "WorkspaceRemediation" SET "verificationStatus"=${result},status=CASE WHEN ${result}='PASS' THEN 'VERIFIED' ELSE status END,"completedAt"=CASE WHEN ${result}='PASS' THEN ${now()} ELSE "completedAt" END,"updatedAt"=${now()} WHERE id=${remediation.id}`);
    }
  }
  if (step.step_key === "close") await tx.$executeRaw(Prisma.sql`UPDATE "ProjectWorkspaceState" SET status='COMPLETED',"completedAt"=${now()},"updatedAt"=${now()} WHERE "projectId"=${run.project_id} AND "organizationId"=${run.organization_id}`);
  if (step.step_key === "schedule_reassessment") {
    const next = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "automation_schedules" ("id","organization_id","project_id","playbook_id","playbook_version_id","interval_seconds","timezone","status","next_run_at","idempotency_seed") VALUES (${randomUUID()},${run.organization_id},${run.project_id},${run.playbook_id},${run.playbook_version_id},${90 * 24 * 60 * 60},'UTC','ACTIVE',${next},${`${run.project_id}:${run.playbook_id}:90d`}) ON CONFLICT DO NOTHING`);
  }
}
function stateValue(run: RunRow, key: string) { return (run.state ?? {})[key]; }

export async function workerTick(workerId: string, limit = 5) {
  const processed: string[] = [];
  for (let i = 0; i < Math.min(limit, 10); i++) {
    const claimed = await db.$queryRaw<RunRow[]>(Prisma.sql`WITH candidate AS (SELECT id FROM "automation_workflow_runs" WHERE status IN ('PENDING','RUNNING','RETRYING','WAITING','WAITING_FOR_APPROVAL') AND (lease_expires_at IS NULL OR lease_expires_at < ${now()}) AND (next_run_at IS NULL OR next_run_at <= ${now()}) ORDER BY updated_at ASC FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE "automation_workflow_runs" r SET "lease_owner"=${workerId},"lease_expires_at"=${new Date(Date.now()+120000)},"updated_at"=${now()},status=CASE WHEN r.status='PENDING' THEN 'RUNNING' ELSE r.status END FROM candidate WHERE r.id=candidate.id RETURNING r.*`);
    const run = claimed[0]; if (!run) break;
    try { await processRun(run); processed.push(run.id); } catch (error) { await failRun(run, error); }
    await db.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET "lease_owner"=NULL,"lease_expires_at"=NULL,"updated_at"=${now()} WHERE id=${run.id} AND "lease_owner"=${workerId}`);
  }
  return processed;
}

async function processRun(run: RunRow) {
  const definition = await loadDefinition(run); const stepDef = definition.steps[run.current_step];
  if (!stepDef) { await db.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET status='COMPLETED',result=${json({ completed: true })}::jsonb,"completed_at"=${now()},"updated_at"=${now()} WHERE id=${run.id}`); return; }
  const steps = await db.$queryRaw<StepRow[]>(Prisma.sql`SELECT * FROM "automation_workflow_steps" WHERE "workflow_run_id"=${run.id} AND "step_key"=${stepDef.key} LIMIT 1`); const step=steps[0]; if(!step) throw new Error("workflow step missing");
  if (step.status === "COMPLETED") { await db.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET "current_step"="current_step"+1,status='RUNNING',"next_run_at"=NULL,"updated_at"=${now()} WHERE id=${run.id}`); return; }
  if (step.step_type === "APPROVAL") {
    const approvals = await db.$queryRaw<Array<{ status: string }>>(Prisma.sql`SELECT status FROM "automation_approvals" WHERE "step_id"=${step.id} LIMIT 1`);
    if (approvals[0]?.status === "APPROVED") { await completeStep(run,step,{approved:true},stepDef); return; }
    if (approvals[0]?.status === "REJECTED") throw new Error("approval rejected");
    if (!approvals[0]) await db.$transaction(async tx=>{ await tx.$executeRaw(Prisma.sql`INSERT INTO "automation_approvals" ("id","workflow_run_id","step_id","organization_id","requested_by_user_id","status","policy") VALUES (${randomUUID()},${run.id},${step.id},${run.organization_id},${run.initiating_actor_user_id},'PENDING',${stepDef.policy ?? 'HUMAN_APPROVAL'})`); await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET status='WAITING_FOR_APPROVAL',"updated_at"=${now()} WHERE id=${run.id}`); await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_steps" SET status='WAITING_FOR_APPROVAL',"updated_at"=${now()} WHERE id=${step.id}`); await appendEvent(tx,run,"APPROVAL_REQUESTED",{policy:stepDef.policy},step.step_key); await audit(tx,run,"APPROVAL_REQUESTED",{policy:stepDef.policy}); });
    return;
  }
  if (step.step_type === "CUSTOMER_INPUT" && ((step.step_key === "request_evidence" && !run.state.customerEvidenceId) || (step.step_key === "verification" && !run.state.verificationEvidenceId))) { await db.$transaction(async tx=>{ await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET status='WAITING',"updated_at"=${now()} WHERE id=${run.id}`); await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_steps" SET status='WAITING',"updated_at"=${now()} WHERE id=${step.id}`); await appendEvent(tx,run,"WORKFLOW_WAITING",{reason:"customer_input"},step.step_key); }); return; }
  const attemptRows = await db.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`SELECT COUNT(*) FROM "automation_step_attempts" WHERE "step_id"=${step.id}`); const attemptNo=Number(attemptRows[0]?.count??0n)+1; const maxAttempts=stepDef.retry?.maxAttempts??1;
  await db.$transaction(async tx=>{ await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_steps" SET status='RUNNING',"started_at"=COALESCE("started_at",${now()}),"actor_type"='system',"actor_id"=${run.initiating_actor_user_id},"authorization_decision"='ALLOW',"updated_at"=${now()} WHERE id=${step.id}`); await tx.$executeRaw(Prisma.sql`INSERT INTO "automation_step_attempts" ("id","step_id","attempt_no","status","request_id") VALUES (${randomUUID()},${step.id},${attemptNo},'RUNNING',${run.request_id})`); });
  const started=Date.now();
  try { const output=await executeStep(run,step,stepDef); if(output.waitingForInput){await db.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET status='WAITING',"updated_at"=${now()} WHERE id=${run.id}`);return;} await completeStep(run,step,output,stepDef,started,attemptNo); }
  catch(error){ const retryable=Boolean((error as Error & {retryable?:boolean}).retryable)||error instanceof Error&&/timeout|temporar|unavailable|429|503/i.test(error.message); if(retryable&&attemptNo<maxAttempts){const delay=(stepDef.retry?.backoffSeconds??5)*2**(attemptNo-1);const retryAt=new Date(Date.now()+delay*1000);await db.$transaction(async tx=>{await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_steps" SET status='RETRYING',"error_code"='RETRYABLE_FAILURE',"error_message"=${String((error as Error).message).slice(0,1000)},"updated_at"=${now()} WHERE id=${step.id}`);await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET status='RETRYING',"next_run_at"=${retryAt},"updated_at"=${now()} WHERE id=${run.id}`);await tx.$executeRaw(Prisma.sql`UPDATE "automation_step_attempts" SET status='RETRYING',"completed_at"=${now()},"duration_ms"=${Date.now()-started},"error_code"='RETRYABLE_FAILURE',"error_message"=${String((error as Error).message).slice(0,1000)},"retry_at"=${retryAt} WHERE "step_id"=${step.id} AND "attempt_no"=${attemptNo}`);});return;}throw error; }
}

async function completeStep(run: RunRow, step: StepRow, output: Record<string, unknown>, definitionStep: DefinitionStep, started=Date.now(), attemptNo?: number) {
  await db.$transaction(async tx=>{
    const fresh=(await tx.$queryRaw<RunRow[]>(Prisma.sql`SELECT * FROM "automation_workflow_runs" WHERE id=${run.id} FOR UPDATE`))[0];
    await persistStepOutcome(tx,fresh,step,output,definitionStep);
    await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_steps" SET status='COMPLETED',output=${json(output)}::jsonb,"completed_at"=${now()},duration_ms=${Date.now()-started},"updated_at"=${now()} WHERE id=${step.id}`);
    if(attemptNo) await tx.$executeRaw(Prisma.sql`UPDATE "automation_step_attempts" SET status='COMPLETED',"completed_at"=${now()},duration_ms=${Date.now()-started} WHERE "step_id"=${step.id} AND "attempt_no"=${attemptNo}`);
    const next=fresh.current_step+1; const definition=await loadDefinition(fresh); const terminal=next>=definition.steps.length;
    await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET "current_step"=${next},status=${terminal?'COMPLETED':'RUNNING'},result=CASE WHEN ${terminal} THEN ${json(output)}::jsonb ELSE result END,"completed_at"=CASE WHEN ${terminal} THEN ${now()} ELSE "completed_at" END,"next_run_at"=NULL,"updated_at"=${now()} WHERE id=${run.id}`);
    await appendEvent(tx,fresh,"STEP_COMPLETED",{output,attempt:attemptNo??0},step.step_key); if(terminal){await appendEvent(tx,fresh,"WORKFLOW_COMPLETED",{result:output});await audit(tx,fresh,"WORKFLOW_COMPLETED",{step:step.step_key});}
  });
}

async function failRun(run: RunRow,error:unknown){const message=String(error instanceof Error?error.message:error).slice(0,1000);await db.$transaction(async tx=>{await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET status='FAILED',"error_code"='WORKFLOW_FAILURE',"error_message"=${message},"completed_at"=${now()},"next_run_at"=NULL,"updated_at"=${now()} WHERE id=${run.id}`);await appendEvent(tx,run,"WORKFLOW_FAILED",{error:message});await audit(tx,run,"WORKFLOW_FAILED",{error:message});});}

export async function approveAutomation(runId:string,organizationId:string,approvalId:string,actorUserId:string,decision:"APPROVED"|"REJECTED"){
  return db.$transaction(async tx=>{const rows=await tx.$queryRaw<Array<{id:string;status:string;workflow_run_id:string}>>(Prisma.sql`SELECT id,status,"workflow_run_id" FROM "automation_approvals" WHERE id=${approvalId} AND "organization_id"=${organizationId} FOR UPDATE`);const approval=rows[0];if(!approval||approval.workflow_run_id!==runId)throw new Error("approval not found");if(approval.status!=="PENDING")throw new Error("approval already decided");await tx.$executeRaw(Prisma.sql`UPDATE "automation_approvals" SET status=${decision},decision=${decision},"approved_by_user_id"=${actorUserId},"decided_at"=${now()} WHERE id=${approvalId}`);await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET status=CASE WHEN ${decision}='APPROVED' THEN 'RUNNING' ELSE 'FAILED' END,"error_code"=CASE WHEN ${decision}='REJECTED' THEN 'APPROVAL_REJECTED' ELSE NULL END,"updated_at"=${now()} WHERE id=${runId}`);const run=(await tx.$queryRaw<RunRow[]>(Prisma.sql`SELECT * FROM "automation_workflow_runs" WHERE id=${runId}`))[0];await appendEvent(tx,run,decision==='APPROVED'?'APPROVAL_GRANTED':'APPROVAL_REJECTED',{approvalId},undefined,'user',actorUserId);await audit(tx,run,decision==='APPROVED'?'APPROVAL_GRANTED':'APPROVAL_REJECTED',{approvalId},actorUserId);return run;});
}

export async function signalAutomation(runId:string,organizationId:string,actorUserId:string,signal:Record<string,unknown>){
  return db.$transaction(async tx=>{const rows=await tx.$queryRaw<RunRow[]>(Prisma.sql`SELECT * FROM "automation_workflow_runs" WHERE id=${runId} AND "organization_id"=${organizationId} FOR UPDATE`);const run=rows[0];if(!run)throw new Error("workflow run not found");if(!["WAITING","PAUSED"].includes(run.status))throw new Error("workflow is not waiting for input");await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET state=state || ${json(signal)}::jsonb,status='RUNNING',"next_run_at"=NULL,"updated_at"=${now()} WHERE id=${runId}`);await appendEvent(tx,run,"WORKFLOW_RESUMED",{signalKeys:Object.keys(signal)},undefined,'user',actorUserId);await audit(tx,run,"WORKFLOW_RESUMED",{signalKeys:Object.keys(signal)},actorUserId);return (await tx.$queryRaw<RunRow[]>(Prisma.sql`SELECT * FROM "automation_workflow_runs" WHERE id=${runId}`))[0];});
}

export async function cancelAutomation(runId:string,organizationId:string,actorUserId:string){return db.$transaction(async tx=>{const rows=await tx.$queryRaw<RunRow[]>(Prisma.sql`SELECT * FROM "automation_workflow_runs" WHERE id=${runId} AND "organization_id"=${organizationId} FOR UPDATE`);const run=rows[0];if(!run)throw new Error("workflow run not found");if(["COMPLETED","FAILED","CANCELLED","EXPIRED"].includes(run.status))return run;await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET status='CANCELLED',"completed_at"=${now()},"updated_at"=${now()} WHERE id=${runId}`);await appendEvent(tx,run,"WORKFLOW_CANCELLED",{},undefined,'user',actorUserId);await audit(tx,run,"WORKFLOW_CANCELLED",{},actorUserId);return (await tx.$queryRaw<RunRow[]>(Prisma.sql`SELECT * FROM "automation_workflow_runs" WHERE id=${runId}`))[0];});}
