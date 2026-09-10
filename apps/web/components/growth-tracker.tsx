"use client";

import { useEffect } from "react";

const ANON_KEY = "tinlance_anonymous_id";

function getAnonymousId() {
  try {
    const existing = window.localStorage.getItem(ANON_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(ANON_KEY, id);
    return id;
  } catch { return undefined; }
}

export function trackGrowthEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const campaign: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const value = params.get(key);
    if (value) campaign[key] = value.slice(0, 256);
  }
  void fetch("/api/v1/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      eventName, source: campaign.utm_source || "website", path: window.location.pathname,
      referrer: document.referrer.slice(0, 2048) || undefined, anonymousId: getAnonymousId(),
      campaign: Object.keys(campaign).length ? campaign : undefined,
      privacyClass: "PUBLIC", properties,
    }),
  }).catch(() => undefined);
}

export function GrowthTracker() {
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/admin") || path.startsWith("/portal")) return;
    trackGrowthEvent("page_view");
  }, []);
  return null;
}
