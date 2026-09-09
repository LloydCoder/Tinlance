declare global {
  type MemoryScope = "WORKING" | "EXECUTION" | "AGENT" | "ORGANIZATION" | "PROJECT" | "CUSTOMER";
  type Classification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "SENSITIVE" | "RESTRICTED";
}

export {};
