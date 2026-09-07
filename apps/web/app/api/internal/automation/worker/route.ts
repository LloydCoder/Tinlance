import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { startAutomation, workerTick } from "@/lib/automation/engine";

export const maxDuration = 300;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  return Boolean(provided && provided === secret);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workerId = `vercel:${randomUUID()}`;
  const due = await db.$queryRaw<Array<{ id: string; organization_id: string; project_id: string; playbook_id: string; playbook_version_id: string; idempotency_seed: string }>>(Prisma.sql`
    SELECT id,"organization_id","project_id","playbook_id","playbook_version_id","idempotency_seed"
    FROM "automation_schedules"
    WHERE status='ACTIVE' AND "next_run_at" <= CURRENT_TIMESTAMP
    ORDER BY "next_run_at" ASC
    FOR UPDATE SKIP LOCKED LIMIT 20
  `).catch(() => []);
  let scheduled = 0;
  for (const schedule of due) {
    const bucket = Math.floor(Date.now() / 3600000);
    const idempotencyKey = `${schedule.idempotency_seed}:${bucket}`;
    try {
      await startAutomation({ organizationId: schedule.organization_id, projectId: schedule.project_id, playbookSlug: "fde-technical-assessment", actorUserId: "automation-system", triggerType: "SCHEDULED", idempotencyKey, requestId: randomUUID(), input: { scheduled: true, scheduleId: schedule.id } });
      await db.$executeRaw(Prisma.sql`UPDATE "automation_schedules" SET "last_run_at"=CURRENT_TIMESTAMP,"next_run_at"=CURRENT_TIMESTAMP + make_interval(secs => "interval_seconds"),"updated_at"=CURRENT_TIMESTAMP WHERE id=${schedule.id}`);
      scheduled++;
    } catch { /* The idempotent run or a transient conflict is retried by the next scheduler tick. */ }
  }
  const processed = await workerTick(workerId, 5);
  return NextResponse.json({ ok: true, scheduled, processed: processed.length, workerId }, { headers: { "Cache-Control": "no-store" } });
}
