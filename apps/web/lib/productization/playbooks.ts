import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { enforceSecurity, buildPrincipal } from "@/lib/security-gateway";
import type { Principal } from "./m14";

async function guard(p:Principal, action:string, risk:"HIGH"|"CRITICAL"="HIGH") {
  const result=await enforceSecurity({principal:buildPrincipal({principalId:p.userId,principalType:p.principalType??"HUMAN",organizationId:p.organizationId,userId:p.userId,permissions:["project:update"]}),action,resourceType:"M14Playbook",dataClassification:"INTERNAL",requestedRisk:risk,approvalPresent:false,context:{tenantId:p.organizationId},requestId:p.requestId});
  if(result.decision!=="ALLOW") throw new Error(`m14_security_${result.decision.toLowerCase()}`);
}
export async function createPlaybook(p:Principal&{opportunityId:string;name:string;version:number;problem:string;targetCustomer:string;preconditions:unknown;inputs:unknown;permissions:unknown;steps:unknown;decisionPoints:unknown;humanApprovals:unknown;outputs:unknown;securityControls:unknown;successCriteria:unknown;failureConditions:unknown;rollback:unknown;estimatedEffortHours?:number;estimatedTimeToValueHours?:number}){
  await guard(p,"m14.playbook.create");
  if(p.version<1) throw new Error("m14_invalid_playbook_version");
  const opp=await db.$queryRaw<Array<{id:string;lifecycleState:string}>>(Prisma.sql`SELECT id,"lifecycleState" FROM "ProductizationOpportunity" WHERE id=${p.opportunityId} AND "organizationId"=${p.organizationId} LIMIT 1`);
  if(!opp[0]) throw new Error("m14_opportunity_not_found");
  if(!["PLAYBOOK_CANDIDATE","PLAYBOOK_VALIDATED","AUTOMATION_CANDIDATE","AUTOMATION_VALIDATED","PRODUCT_CANDIDATE","PRODUCT_EXPERIMENT","PRODUCT_VALIDATED","PRODUCTIZED","SCALED"].includes(opp[0].lifecycleState)) throw new Error("m14_playbook_state_not_ready");
  const existing=await db.$queryRaw<Array<{id:string;currentVersion:number}>>(Prisma.sql`SELECT id,"currentVersion" FROM "ProductizationPlaybook" WHERE "opportunityId"=${p.opportunityId} AND "organizationId"=${p.organizationId} LIMIT 1`);
  const playbookId=existing[0]?.id??`m14pb_${randomUUID().replaceAll("-","")}`;
  if(existing[0]&&p.version<=existing[0].currentVersion) throw new Error("m14_playbook_version_not_monotonic");
  const content=JSON.stringify({problem:p.problem,targetCustomer:p.targetCustomer,preconditions:p.preconditions,inputs:p.inputs,permissions:p.permissions,steps:p.steps,decisionPoints:p.decisionPoints,humanApprovals:p.humanApprovals,outputs:p.outputs,securityControls:p.securityControls,successCriteria:p.successCriteria,failureConditions:p.failureConditions,rollback:p.rollback,estimatedEffortHours:p.estimatedEffortHours,estimatedTimeToValueHours:p.estimatedTimeToValueHours});
  const versionId=`m14pbv_${randomUUID().replaceAll("-","")}`;
  await db.$transaction(async tx=>{if(!existing[0]) await tx.$executeRaw(Prisma.sql`INSERT INTO "ProductizationPlaybook" ("id","organizationId","opportunityId","name","status","currentVersion","createdByUserId") VALUES (${playbookId},${p.organizationId},${p.opportunityId},${p.name},'DRAFT',${p.version},${p.userId})`);else await tx.$executeRaw(Prisma.sql`UPDATE "ProductizationPlaybook" SET "name"=${p.name},"currentVersion"=${p.version},"updatedAt"=CURRENT_TIMESTAMP WHERE id=${playbookId} AND "organizationId"=${p.organizationId}`);await tx.$executeRaw(Prisma.sql`INSERT INTO "ProductizationPlaybookVersion" ("id","playbookId","version","problem","targetCustomer","preconditions","inputs","permissions","steps","decisionPoints","humanApprovals","outputs","securityControls","successCriteria","failureConditions","rollback","estimatedEffortHours","estimatedTimeToValueHours","contentHash","createdByUserId") VALUES (${versionId},${playbookId},${p.version},${p.problem},${p.targetCustomer},${JSON.stringify(p.preconditions)}::jsonb,${JSON.stringify(p.inputs)}::jsonb,${JSON.stringify(p.permissions)}::jsonb,${JSON.stringify(p.steps)}::jsonb,${JSON.stringify(p.decisionPoints)}::jsonb,${JSON.stringify(p.humanApprovals)}::jsonb,${JSON.stringify(p.outputs)}::jsonb,${JSON.stringify(p.securityControls)}::jsonb,${JSON.stringify(p.successCriteria)}::jsonb,${JSON.stringify(p.failureConditions)}::jsonb,${JSON.stringify(p.rollback)}::jsonb,${p.estimatedEffortHours??null},${p.estimatedTimeToValueHours??null},${createHash("sha256").update(content).digest("hex")},${p.userId})`);});
  await db.auditEvent.create({data:{organizationId:p.organizationId,actorUserId:p.userId,action:"M14_PLAYBOOK_VERSION_CREATED",resourceType:"M14Playbook",resourceId:playbookId,requestId:p.requestId,metadata:{version:p.version,versionId}}});
  return {playbookId,versionId,version:p.version};
}
