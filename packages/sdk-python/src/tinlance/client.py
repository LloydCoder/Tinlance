from __future__ import annotations
import json
from dataclasses import dataclass
from urllib.error import HTTPError
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen

@dataclass
class TinlanceApiError(Exception):
    problem: dict
    def __str__(self): return self.problem.get("title","Tinlance API error")

class TinlanceClient:
    def __init__(self, api_key:str, base_url:str="https://www.tinlance.com"):
        if not api_key.startswith("tl_live_"): raise ValueError("invalid Tinlance API key")
        self.api_key=api_key; self.base_url=base_url.rstrip("/")
    def _request(self,path:str,method:str="GET",body=None,idempotency_key:str|None=None):
        headers={"Authorization":f"Bearer {self.api_key}","Accept":"application/json"}; payload=None
        if body is not None: headers["Content-Type"]="application/json"; payload=json.dumps(body).encode()
        if idempotency_key: headers["Idempotency-Key"]=idempotency_key
        try:
            with urlopen(Request(self.base_url+path,data=payload,headers=headers,method=method),timeout=30) as response:
                data=json.loads(response.read().decode()); return data.get("data",data)
        except HTTPError as exc:
            raw=exc.read().decode()
            try: problem=json.loads(raw)
            except json.JSONDecodeError: problem={"title":"Tinlance API error","status":exc.code}
            raise TinlanceApiError(problem)
    def get_metadata(self): return self._request("/v1")
    def list_projects(self,limit:int|None=None,cursor:str|None=None):
        q={};
        if limit is not None: q["limit"]=str(limit)
        if cursor: q["cursor"]=cursor
        return self._request("/v1/projects"+(("?"+urlencode(q)) if q else ""))
    def create_project(self,input:dict,idempotency_key:str): return self._request("/v1/projects","POST",input,idempotency_key)
    def get_project(self,project_id:str): return self._request("/v1/projects/"+quote(project_id,safe=""))
    def create_assessment(self,project_id:str,input:dict,idempotency_key:str): return self._request("/v1/projects/"+quote(project_id,safe="")+"/assessments","POST",input,idempotency_key)
    def execute_assessment(self,assessment_id:str,idempotency_key:str): return self._request("/v1/assessments/"+quote(assessment_id,safe="")+"/execute","POST",None,idempotency_key)
