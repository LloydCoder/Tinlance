import { startAutomation } from "@/lib/automation/engine";
import { getAssessment, getProject, getReport, listFindings, listProjects, listRemediation } from "@/lib/mcp/data";
import { retrieveKnowledge } from "@/lib/knowledge";
import type { McpToolDefinition } from "@/lib/mcp/registry";
import type { McpPrincipal } from "@/lib/mcp/policy";
import { db } from "@/lib/db";

export async function executeMcpTool(input: { principal: McpPrincipal; tool: McpToolDefinition; args: Record<string, unknown>; requestId: string }) {
  const { principal, tool, args, requestId } = input;
  switch (tool.name) {
    case "tinlance.projects.list": return listProjects(principal.organizationId, args.limit as number | undefined, args.cursor as string | undefined);
    case "tinlance.projects.get": return getProject(principal.organizationId, args.projectId as string);
    case "tinlance.assessments.get": return getAssessment(principal.organizationId, args.assessmentId as string);
    case "tinlance.findings.list": return listFindings(principal.organizationId, args.projectId as string, args.limit as number | undefined, args.cursor as string | undefined);
    case "tinlance.reports.get": return getReport(principal.organizationId, args.reportId as string);
    case "tinlance.remediation.list": return listRemediation(principal.organizationId, args.projectId as string, args.limit as number | undefined, args.cursor as string | undefined);
    case "tinlance.knowledge.search": return retrieveKnowledge({ principalId: principal.agentId, principalType: "AI_AGENT", organizationId: principal.organizationId, agentId: principal.agentId, requestId, query: args.query as string, projectId: args.projectId as string | undefined, assessmentId: args.assessmentId as string | undefined, maxResults: args.limit as number | undefined });
    case "tinlance.assessments.execute": {
      const assessmentId = args.assessmentId as string;
      const projectId = args.projectId as string;
      const idempotencyKey = args.idempotencyKey as string;
      const assessment = await db.workspaceAssessment.findFirst({ where: { id: assessmentId, projectId, organizationId: principal.organizationId }, select: { id: true, projectId: true, assessmentId: true, type: true, status: true } });
      if (!assessment) throw new Error("assessment_not_found");
      if (["COMPLETED", "REPORT_ISSUED"].includes(assessment.status)) throw new Error("assessment_already_completed");
      const domain = assessment.type.toLowerCase();
      const run = await startAutomation({ organizationId: principal.organizationId, projectId: assessment.projectId, assessmentId: assessment.assessmentId, playbookSlug: "fde-technical-assessment", actorUserId: principal.ownerUserId, triggerType: "API", idempotencyKey: `m9-agent:${principal.agentId}:${idempotencyKey}`, requestId, input: { assessmentId, domain, source: "m9-agent-runtime" } });
      return { workflowRunId: run.id, status: run.status, assessmentId };
    }
    default: throw new Error("m6_tool_dispatch_unavailable");
  }
}
