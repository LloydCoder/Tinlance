import { createPublicKey, randomUUID, verify } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { startAutomation, workerTick } from "@/lib/automation/engine";

export const maxDuration = 300;

type ScheduleRow = {
  id: string;
  organization_id: string;
  project_id: string;
  playbook_id: string;
  playbook_version_id: string;
  interval_seconds: number;
  next_run_at: Date;
  idempotency_seed: string;
  created_by_user_id: string | null;
};

async function authorized(request: Request) {
  const provided = request.headers.get("authorization")?.replace(/^Bearer\\s+/i, "").trim();
  if (!provided) return false;

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && provided === cronSecret) return true;

  try {
    const [encodedHeader, encodedPayload, encodedSignature] = provided.split(".");
    if (!encodedHeader || !encodedPayload || !encodedSignature) return false;
    const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8")) as { alg?: string; kid?: string };
    if (header.alg !== "RS256" || !header.kid) return false;
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Record<string, unknown>;
    const response = await fetch("https://token.actions.githubusercontent.com/.well-known/jwks", { cache: "no-store" });
    if (!response.ok) return false;
    const jwks = await response.json() as { keys?: Array<JsonWebKey & { kid?: string }> };
    const jwk = jwks.keys?.find(key => key.kid === header.kid);
    if (!jwk) return false;
    const publicKey = createPublicKey({ key: jwk, format: "jwk" });
    const validSignature = verify(
      "RSA-SHA256",
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      publicKey,
      Buffer.from(encodedSignature, "base64url"),
    );
    if (!validSignature) return false;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.iss === "https://token.actions.githubusercontent.com" &&
      payload.aud === "tinlance-automation-worker" &&
      payload.repository === "LloydCoder/Tinlance" &&
      payload.ref === "refs/heads/main" &&
      payload.workflow_ref === "LloydCoder/Tinlance/.github/workflows/m4-automation-worker.yml@refs/heads/main" &&
      ["schedule", "workflow_dispatch"].includes(String(payload.event_name)) &&
      typeof payload.exp === "number" && payload.exp > nowSeconds &&
      typeof payload.nbf === "number" && payload.nbf <= nowSeconds + 30;
  } catch {
    return false;
  }
}

async function createScheduledAssessment(schedule: ScheduleRow) {
  const dueBucket = Math.floor(new Date(schedule.next_run_at).getTime() / 3600000);
  const idempotencyKey = `${schedule.idempotency_seed}:assessment:${dueBucket}`;
  return db.$transaction(async tx => {
    const previous = await tx.$queryRaw<Array<{
      lead_id: string;
      problem: string;
      workflow: string | null;
      current_architecture: string | null;
      constraints: string | null;
      desired_outcome: string;
      urgency: string | null;
      stakeholders: string | null;
      existing_systems: string | null;
      security_requirements: string | null;
      business_impact: string | null;
      assessment_type: string;
      objective: string;
      scope: unknown;
      methodology: string;
      version: string;
    }>>(Prisma.sql`
      SELECT a."leadId" AS lead_id,a.problem,a.workflow,
        a."currentArchitecture" AS current_architecture,a.constraints,
        a."desiredOutcome" AS desired_outcome,a.urgency,a.stakeholders,
        a."existingSystems" AS existing_systems,
        a."securityRequirements" AS security_requirements,
        a."businessImpact" AS business_impact,
        wa.type AS assessment_type,wa.objective,wa.scope,wa.methodology,wa.version
      FROM "WorkspaceAssessment" wa
      JOIN "Assessment" a ON a.id=wa."assessmentId"
      WHERE wa."organizationId"=${schedule.organization_id}
        AND wa."projectId"=${schedule.project_id}
      ORDER BY wa."createdAt" DESC
      LIMIT 1
    `);
    if (!previous[0]) throw new Error("scheduled_reassessment_has_no_previous_assessment");

    const existing = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id FROM "Assessment" WHERE "idempotencyKey"=${idempotencyKey} LIMIT 1
    `);
    let assessmentId = existing[0]?.id;
    if (!assessmentId) {
      assessmentId = randomUUID();
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "Assessment"
          (id,"organizationId","leadId",problem,workflow,"currentArchitecture",constraints,
           "desiredOutcome",urgency,stakeholders,"existingSystems","securityRequirements",
           "businessImpact",status,"idempotencyKey")
        VALUES
          (${assessmentId},${schedule.organization_id},${previous[0].lead_id},${previous[0].problem},
           ${previous[0].workflow},${previous[0].current_architecture},${previous[0].constraints},
           ${previous[0].desired_outcome},${previous[0].urgency},${previous[0].stakeholders},
           ${previous[0].existing_systems},${previous[0].security_requirements},
           ${previous[0].business_impact},'submitted',${idempotencyKey})
      `);
    }

    const workspaceAssessment = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id FROM "WorkspaceAssessment" WHERE "assessmentId"=${assessmentId} LIMIT 1
    `);
    if (!workspaceAssessment[0]) {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "WorkspaceAssessment"
          (id,"projectId","organizationId","assessmentId",type,objective,scope,methodology,
           status,"resultStatus","assessorUserId",version)
        VALUES
          (${randomUUID()},${schedule.project_id},${schedule.organization_id},${assessmentId},
           ${previous[0].assessment_type},${previous[0].objective},${JSON.stringify(previous[0].scope)}::jsonb,
           ${previous[0].methodology},'PLANNED','NOT_ASSESSED',${schedule.created_by_user_id},${previous[0].version})
      `);
    }
    return { assessmentId, scope: previous[0].scope };
  });
}

export async function GET(request: Request) {
  if (!await authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workerId = `automation-worker:${randomUUID()}`;

  const due = await db.$queryRaw<ScheduleRow[]>(Prisma.sql`
    WITH candidate AS (
      SELECT id
      FROM "automation_schedules"
      WHERE status='ACTIVE'
        AND "next_run_at" <= CURRENT_TIMESTAMP
        AND ("lease_expires_at" IS NULL OR "lease_expires_at" <= CURRENT_TIMESTAMP)
      ORDER BY "next_run_at" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 5
    )
    UPDATE "automation_schedules" s
    SET "lease_owner"=${workerId},
        "lease_expires_at"=CURRENT_TIMESTAMP + INTERVAL '10 minutes',
        "updated_at"=CURRENT_TIMESTAMP
    FROM candidate
    WHERE s.id=candidate.id
    RETURNING s.id,s."organization_id",s."project_id",s."playbook_id",
      s."playbook_version_id",s."interval_seconds",s."next_run_at",
      s."idempotency_seed",s."created_by_user_id"
  `);

  let scheduled = 0;
  const failures: Array<{ scheduleId: string; error: string }> = [];
  for (const schedule of due) {
    try {
      if (!schedule.created_by_user_id) {
        await db.$executeRaw(Prisma.sql`
          UPDATE "automation_schedules"
          SET status='PAUSED',"last_error"='schedule_owner_missing',
            "lease_owner"=NULL,"lease_expires_at"=NULL,"updated_at"=CURRENT_TIMESTAMP
          WHERE id=${schedule.id} AND "lease_owner"=${workerId}
        `);
        failures.push({ scheduleId: schedule.id, error: "schedule_owner_missing" });
        continue;
      }

      const { assessmentId, scope } = await createScheduledAssessment(schedule);
      const bucket = Math.floor(new Date(schedule.next_run_at).getTime() / 3600000);
      const idempotencyKey = `${schedule.idempotency_seed}:${bucket}`;
      await startAutomation({
        organizationId: schedule.organization_id,
        projectId: schedule.project_id,
        assessmentId,
        playbookSlug: "fde-technical-assessment",
        playbookVersionId: schedule.playbook_version_id,
        actorUserId: schedule.created_by_user_id,
        triggerType: "SCHEDULED",
        idempotencyKey,
        requestId: randomUUID(),
        input: { scope, scheduled: true, scheduleId: schedule.id },
      });
      await db.$executeRaw(Prisma.sql`
        UPDATE "automation_schedules"
        SET "last_run_at"=CURRENT_TIMESTAMP,
          "next_run_at"=CURRENT_TIMESTAMP + make_interval(secs => "interval_seconds"),
          "lease_owner"=NULL,"lease_expires_at"=NULL,
          "last_error"=NULL,"failure_count"=0,"updated_at"=CURRENT_TIMESTAMP
        WHERE id=${schedule.id} AND "lease_owner"=${workerId}
      `);
      scheduled++;
    } catch (error) {
      const message = String(error instanceof Error ? error.message : error).slice(0, 1000);
      await db.$executeRaw(Prisma.sql`
        UPDATE "automation_schedules"
        SET "last_error"=${message},"failure_count"="failure_count"+1,
          "lease_owner"=NULL,"lease_expires_at"=NULL,"updated_at"=CURRENT_TIMESTAMP
        WHERE id=${schedule.id} AND "lease_owner"=${workerId}
      `);
      failures.push({ scheduleId: schedule.id, error: message });
    }
  }

  const processed = await workerTick(workerId, 1);
  return NextResponse.json(
    { ok: failures.length === 0, scheduled, processed: processed.length, failures, workerId },
    { status: failures.length === 0 ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
