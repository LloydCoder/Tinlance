import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { growthEventSchema, type GrowthEventInput } from "@/lib/growth/event-contract";

/** Persist canonical growth telemetry. Never use this for authorization or business truth. */
export async function recordGrowthEvent(input: GrowthEventInput): Promise<void> {
  const event = growthEventSchema.parse(input);
  await db.growthEvent.create({
    data: {
      eventId: randomUUID(),
      eventName: event.eventName,
      schemaVersion: event.schemaVersion,
      occurredAt: event.occurredAt ?? new Date(),
      anonymousId: event.anonymousId,
      userId: event.userId,
      organizationId: event.organizationId,
      source: event.source,
      path: event.path,
      referrer: event.referrer,
      campaign: event.campaign,
      entityId: event.entityId,
      privacyClass: event.privacyClass,
      properties: event.properties,
    },
  });
}
