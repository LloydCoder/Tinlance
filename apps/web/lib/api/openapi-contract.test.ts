import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(process.cwd());
const specPath = path.join(root, "../../docs/api/openapi/v1.json");
function routeFile(apiPath: string) {
  const parts = apiPath.replace(/^\/v1\/?/, "").split("/").filter(Boolean).map((part) => part.startsWith("{") && part.endsWith("}") ? `[${part.slice(1, -1)}]` : part);
  return path.join(root, "app/api/v1", ...parts, "route.ts");
}

describe("M5 API contract", () => {
  it("is a valid JSON OpenAPI 3.1.1 document with unique operationIds", () => {
    const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
    expect(spec.openapi).toBe("3.1.1"); expect(spec.info.version).toBe("1.0.0"); expect(Object.keys(spec.paths).length).toBeGreaterThan(10);
    const ids = Object.values(spec.paths).flatMap((item) => Object.values(item as Record<string, Record<string, unknown>>).filter((value) => value && typeof value === "object" && "operationId" in value).map((value) => (value as { operationId: string }).operationId));
    expect(new Set(ids).size).toBe(ids.length); expect(ids.every(Boolean)).toBe(true);
  });

  it("maps every stable /v1 path to a real Next route handler", () => {
    const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
    for (const apiPath of Object.keys(spec.paths)) expect(fs.existsSync(routeFile(apiPath)), `${apiPath} route missing`).toBe(true);
  });

  it("uses the bounded pagination and problem-detail contract", () => {
    const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
    expect(spec.components.parameters.Limit.schema.maximum).toBe(100);
    expect(spec.components.schemas.Problem.properties.code).toBeTruthy();
    expect(spec.components.schemas.Problem.properties.requestId).toBeTruthy();
    expect(spec.components.responses.Problem.content["application/problem+json"]).toBeTruthy();
  });
});
