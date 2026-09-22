-- Gate C: database-level tenant consistency for customer workspace records.
-- PostgreSQL composite foreign keys make the organization/project pair part of
-- referential integrity, preventing cross-tenant child rows even if application
-- authorization is bypassed or a future query forgets an organization predicate.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ProjectWorkspaceState" s
    LEFT JOIN "Project" p ON p.id = s."projectId" AND p."organizationId" = s."organizationId"
    WHERE p.id IS NULL
  ) THEN RAISE EXCEPTION 'Gate C blocked: ProjectWorkspaceState contains cross-tenant project references'; END IF;

  IF EXISTS (
    SELECT 1
    FROM "WorkspaceAssessment" a
    LEFT JOIN "Project" p ON p.id = a."projectId" AND p."organizationId" = a."organizationId"
    WHERE p.id IS NULL
  ) THEN RAISE EXCEPTION 'Gate C blocked: WorkspaceAssessment contains cross-tenant project references'; END IF;

  IF EXISTS (
    SELECT 1
    FROM "WorkspaceAssessmentResult" r
    LEFT JOIN "Project" p ON p.id = r."projectId" AND p."organizationId" = r."organizationId"
    WHERE p.id IS NULL
  ) THEN RAISE EXCEPTION 'Gate C blocked: WorkspaceAssessmentResult contains cross-tenant project references'; END IF;

  IF EXISTS (
    SELECT 1
    FROM "WorkspaceFinding" f
    LEFT JOIN "Project" p ON p.id = f."projectId" AND p."organizationId" = f."organizationId"
    WHERE p.id IS NULL
  ) THEN RAISE EXCEPTION 'Gate C blocked: WorkspaceFinding contains cross-tenant project references'; END IF;

  IF EXISTS (
    SELECT 1
    FROM "WorkspaceEvidence" e
    LEFT JOIN "Project" p ON p.id = e."projectId" AND p."organizationId" = e."organizationId"
    WHERE p.id IS NULL
  ) THEN RAISE EXCEPTION 'Gate C blocked: WorkspaceEvidence contains cross-tenant project references'; END IF;

  IF EXISTS (
    SELECT 1
    FROM "WorkspaceReport" r
    LEFT JOIN "Project" p ON p.id = r."projectId" AND p."organizationId" = r."organizationId"
    WHERE p.id IS NULL
  ) THEN RAISE EXCEPTION 'Gate C blocked: WorkspaceReport contains cross-tenant project references'; END IF;

  IF EXISTS (
    SELECT 1
    FROM "WorkspaceRemediation" r
    LEFT JOIN "Project" p ON p.id = r."projectId" AND p."organizationId" = r."organizationId"
    WHERE p.id IS NULL
  ) THEN RAISE EXCEPTION 'Gate C blocked: WorkspaceRemediation contains cross-tenant project references'; END IF;

  IF EXISTS (
    SELECT 1
    FROM "WorkspaceVerification" v
    LEFT JOIN "Project" p ON p.id = v."projectId" AND p."organizationId" = v."organizationId"
    WHERE p.id IS NULL
  ) THEN RAISE EXCEPTION 'Gate C blocked: WorkspaceVerification contains cross-tenant project references'; END IF;

  IF EXISTS (
    SELECT 1
    FROM "WorkspaceEvidenceRequest" r
    LEFT JOIN "Project" p ON p.id = r."projectId" AND p."organizationId" = r."organizationId"
    WHERE p.id IS NULL
  ) THEN RAISE EXCEPTION 'Gate C blocked: WorkspaceEvidenceRequest contains cross-tenant project references'; END IF;

  IF EXISTS (
    SELECT 1
    FROM "WorkspaceNote" n
    LEFT JOIN "Project" p ON p.id = n."projectId" AND p."organizationId" = n."organizationId"
    WHERE p.id IS NULL
  ) THEN RAISE EXCEPTION 'Gate C blocked: WorkspaceNote contains cross-tenant project references'; END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Project_id_organizationId_key"
  ON "Project"("id","organizationId");

ALTER TABLE "ProjectWorkspaceState"
  ADD CONSTRAINT "ProjectWorkspaceState_project_tenant_fkey"
  FOREIGN KEY ("projectId","organizationId")
  REFERENCES "Project"("id","organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceAssessment"
  ADD CONSTRAINT "WorkspaceAssessment_project_tenant_fkey"
  FOREIGN KEY ("projectId","organizationId")
  REFERENCES "Project"("id","organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceAssessmentResult"
  ADD CONSTRAINT "WorkspaceAssessmentResult_project_tenant_fkey"
  FOREIGN KEY ("projectId","organizationId")
  REFERENCES "Project"("id","organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceFinding"
  ADD CONSTRAINT "WorkspaceFinding_project_tenant_fkey"
  FOREIGN KEY ("projectId","organizationId")
  REFERENCES "Project"("id","organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceEvidence"
  ADD CONSTRAINT "WorkspaceEvidence_project_tenant_fkey"
  FOREIGN KEY ("projectId","organizationId")
  REFERENCES "Project"("id","organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceReport"
  ADD CONSTRAINT "WorkspaceReport_project_tenant_fkey"
  FOREIGN KEY ("projectId","organizationId")
  REFERENCES "Project"("id","organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceRemediation"
  ADD CONSTRAINT "WorkspaceRemediation_project_tenant_fkey"
  FOREIGN KEY ("projectId","organizationId")
  REFERENCES "Project"("id","organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceVerification"
  ADD CONSTRAINT "WorkspaceVerification_project_tenant_fkey"
  FOREIGN KEY ("projectId","organizationId")
  REFERENCES "Project"("id","organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceEvidenceRequest"
  ADD CONSTRAINT "WorkspaceEvidenceRequest_project_tenant_fkey"
  FOREIGN KEY ("projectId","organizationId")
  REFERENCES "Project"("id","organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceNote"
  ADD CONSTRAINT "WorkspaceNote_project_tenant_fkey"
  FOREIGN KEY ("projectId","organizationId")
  REFERENCES "Project"("id","organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;
