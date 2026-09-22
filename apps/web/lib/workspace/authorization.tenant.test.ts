import { describe, expect, it } from "vitest";
import { canAccessWorkspaceOrganization } from "./authorization";

describe("workspace tenant boundary", () => {
  it("allows a member to access only the active organization", () => {
    const principal = { organizationId: "org-a", globalRole: "admin" };
    expect(canAccessWorkspaceOrganization(principal, "org-a")).toBe(true);
    expect(canAccessWorkspaceOrganization(principal, "org-b")).toBe(false);
  });

  it("allows explicit super-admin cross-tenant access", () => {
    const principal = { organizationId: "org-a", globalRole: "super-admin" };
    expect(canAccessWorkspaceOrganization(principal, "org-b")).toBe(true);
  });

  it("does not treat privileged admin as an implicit cross-tenant override", () => {
    const principal = { organizationId: "org-a", globalRole: "admin" };
    expect(canAccessWorkspaceOrganization(principal, "org-b")).toBe(false);
  });

  it("does not grant cross-tenant access to client roles", () => {
    for (const globalRole of [null, "client-admin", "member", "viewer"]) {
      expect(canAccessWorkspaceOrganization({ organizationId: "org-a", globalRole }, "org-b")).toBe(false);
    }
  });
});
