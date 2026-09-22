import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const INCIDENT_STATUSES=["DETECTED","TRIAGED","CONTAINED","INVESTIGATING","REMEDIATING","CUSTOMER_NOTIFICATION","POSTMORTEM","CLOSED"] as const;
export const INCIDENT_SEVERITIES=["SEV1","SEV2","SEV3","SEV4"] as const;
const transitions:Record<string,readonly string[]>={DETECTED:["TRIAGED"],TRIAGED:["CONTAINED","INVESTIGATING"],CONTAINED:["INVESTIGATING","REMEDIATING"],INVESTIGATING:["REMEDIATING","CUSTOMER_NOTIFICATION"],REMEDIATING:["CUSTOMER_NOTIFICATION","POSTMORTEM"],CUSTOMER_NOTIFICATION:["POSTMORTEM","CLOSED"],POSTMORTEM:["CLOSED"],CLOSED:[]};
export function validateIncidentTransition(from:string,to:string){if(!transitions[from]?.includes(to)) throw new Error("invalid_incident_transition"); return true;}

export async function createIncident(p:{organizationId?:string|null;title:string;severity:string;summary:string;userId:string;requestId:string;correlationId?:string}){
 if(!INCIDENT_SEVERITIES.includes(p.severity as typeof INCIDENT_SEVERITIES[number])) throw new Error("invalid_incident_severity");
 if(!p.title.trim()||!p.summary.trim()||p.title.length>300||p.summary.length>10000) throw new Error("invalid_incident_input");
 const id=`inc_${randomUUID().replaceAll("-","")}`;
 await db.$transaction(async tx=>{
  await tx.$executeRaw(Prisma.sql`INSERT INTO "Incident" ("id","organizationId","title","severity","summary","correlationId","createdByUserId","updatedAt") VALUES (${id},${p.organizationId??null},${p.title.trim()},${p.severity},${p.summary.trim()},${p.correlationId??null},${p.userId},CURRENT_TIMESTAMP)`);
  await tx.$executeRaw(Prisma.sql`INSERT INTO "IncidentEvent" ("id","incidentId","type","actorUserId","requestId","message") VALUES (${`incev_${randomUUID().replaceAll("-","")}`},${id},'DETECTED',${p.userId},${p.requestId},'Incident detected')`);
 });
 return {id,status:"DETECTED" as const};
}

export async function transitionIncident(p:{incidentId:string;to:string;message:string;userId:string;requestId:string}){
 if(!p.message.trim()||p.message.length>5000) throw new Error("invalid_incident_message");
 const rows=await db.$queryRaw<Array<{id:string;status:string;organizationId:string|null;severity:string}>>(Prisma.sql`SELECT id,status,"organizationId",severity FROM "Incident" WHERE id=${p.incidentId} LIMIT 1`);
 if(!rows[0]) throw new Error("incident_not_found");
 validateIncidentTransition(rows[0].status,p.to);
 await db.$transaction(async tx=>{
  await tx.$executeRaw(Prisma.sql`UPDATE "Incident" SET status=${p.to},"containedAt"=CASE WHEN ${p.to}='CONTAINED' THEN COALESCE("containedAt",CURRENT_TIMESTAMP) ELSE "containedAt" END,"resolvedAt"=CASE WHEN ${p.to}='CLOSED' THEN CURRENT_TIMESTAMP ELSE "resolvedAt" END,"updatedAt"=CURRENT_TIMESTAMP WHERE id=${p.incidentId}`);
  await tx.$executeRaw(Prisma.sql`INSERT INTO "IncidentEvent" ("id","incidentId","type","actorUserId","requestId","message") VALUES (${`incev_${randomUUID().replaceAll("-","")}`},${p.incidentId},${p.to},${p.userId},${p.requestId},${p.message.trim()})`);
  if(rows[0].organizationId) await tx.auditEvent.create({data:{id:`aud_${randomUUID().replaceAll("-","")}`,organizationId:rows[0].organizationId,actorUserId:p.userId,action:`INCIDENT_${p.to}`,resourceType:"Incident",resourceId:p.incidentId,requestId:p.requestId,metadata:{severity:rows[0].severity}}});
 });
 return {id:p.incidentId,from:rows[0].status,to:p.to};
}