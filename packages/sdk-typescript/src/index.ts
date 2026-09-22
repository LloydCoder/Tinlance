export type TinlanceProblem={type:string;title:string;status:number;detail?:string;code:string;requestId:string};
export type TinlanceClientOptions={apiKey:string;baseUrl?:string;fetch?:typeof globalThis.fetch};
export class TinlanceApiError extends Error{constructor(public problem:TinlanceProblem){super(problem.title);this.name="TinlanceApiError";}}
export class TinlanceClient{
 private readonly apiKey:string; private readonly baseUrl:string; private readonly fetchImpl:typeof globalThis.fetch;
 constructor(options:TinlanceClientOptions){if(!options.apiKey.startsWith("tl_live_"))throw new Error("invalid Tinlance API key");this.apiKey=options.apiKey;this.baseUrl=(options.baseUrl??"https://www.tinlance.com").replace(/\/$/,"");this.fetchImpl=options.fetch??globalThis.fetch;}
 private async request<T>(path:string,init:RequestInit={},idempotencyKey?:string):Promise<T>{const headers=new Headers(init.headers);headers.set("authorization",`Bearer ${this.apiKey}`);headers.set("accept","application/json");if(init.body&&!headers.has("content-type"))headers.set("content-type","application/json");if(idempotencyKey)headers.set("Idempotency-Key",idempotencyKey);const response=await this.fetchImpl(`${this.baseUrl}${path}`,{...init,headers});const body=await response.json().catch(()=>null);if(!response.ok){if(body?.code&&body?.requestId)throw new TinlanceApiError(body);throw new Error(`Tinlance API request failed: ${response.status}`);}return body?.data??body;}
 async getMetadata(){return this.request<{apiVersion:string;status:string;openapi:string}>("/v1");}
 async listProjects(params:{limit?:number;cursor?:string}={}){const q=new URLSearchParams();if(params.limit)q.set("limit",String(params.limit));if(params.cursor)q.set("cursor",params.cursor);return this.request<any>(`/v1/projects?${q}`);}
 async createProject(input:{name:string;type?:string;description?:string;dueAt?:string},idempotencyKey:string){return this.request<any>("/v1/projects",{method:"POST",body:JSON.stringify(input)},idempotencyKey);}
 async getProject(projectId:string){return this.request<any>(`/v1/projects/${encodeURIComponent(projectId)}`);}
 async createAssessment(projectId:string,input:{type:string;objective:string;scope?:Record<string,unknown>;methodology:string;version?:string},idempotencyKey:string){return this.request<any>(`/v1/projects/${encodeURIComponent(projectId)}/assessments`,{method:"POST",body:JSON.stringify(input)},idempotencyKey);}
 async executeAssessment(assessmentId:string,idempotencyKey:string){return this.request<any>(`/v1/assessments/${encodeURIComponent(assessmentId)}/execute`,{method:"POST"},idempotencyKey);}
 async listFindings(params:{projectId?:string;limit?:number;cursor?:string}={}){const q=new URLSearchParams();if(params.projectId)q.set("projectId",params.projectId);if(params.limit)q.set("limit",String(params.limit));if(params.cursor)q.set("cursor",params.cursor);return this.request<any>(`/v1/findings?${q}`);}
 async getReport(reportId:string){return this.request<any>(`/v1/reports/${encodeURIComponent(reportId)}`);}
}
