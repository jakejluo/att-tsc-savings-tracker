import { AuditEntry, Role, SavingsEvent, Summary } from "../shared/types";
import type { NewEvent } from "./components/LogForm";

export interface Session {
  token: string;
  user: { name: string; role: Role };
}

const KEY = "tsc-session";
export const loadSession = (): Session | null => JSON.parse(sessionStorage.getItem(KEY) ?? "null");
export const saveSession = (s: Session | null) =>
  s ? sessionStorage.setItem(KEY, JSON.stringify(s)) : sessionStorage.removeItem(KEY);

async function call<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body as T;
}

export const api = {
  login: (name: string, role: Role) => call<Session>("/login", { method: "POST", body: JSON.stringify({ name, role }) }),
  events: (t: string) => call<SavingsEvent[]>("/events", {}, t),
  summary: (t: string) => call<Summary>("/summary", {}, t),
  audit: (t: string) => call<AuditEntry[]>("/audit", {}, t),
  create: (t: string, e: NewEvent) => call<SavingsEvent>("/events", { method: "POST", body: JSON.stringify(e) }, t),
  approve: (t: string, id: number) => call<SavingsEvent>(`/events/${id}/approve`, { method: "POST" }, t),
};
