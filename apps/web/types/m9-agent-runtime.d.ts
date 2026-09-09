declare module "@/lib/agent-runtime" {
  export interface AgentMemory {
    id: string;
    scope: string;
    classification: string;
    trust: string;
    content: string;
    source: string;
  }
}

declare global {
  type MemoryScope = "WORKING" | "EXECUTION" | "AGENT" | "ORGANIZATION" | "PROJECT" | "CUSTOMER";
  type Classification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "SENSITIVE" | "RESTRICTED";
}

export {};
