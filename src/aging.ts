import { AuditEntry, SavingsEvent } from "../shared/types";

export const BUCKETS = ["0-7", "8-30", "30+"] as const;
export type Bucket = (typeof BUCKETS)[number];

const DAY = 86_400_000;

export function pendingSince(e: SavingsEvent, audit: AuditEntry[]) {
  const created = audit.find((a) => a.eventId === e.id && a.action === "event.created");
  return created?.at ?? `${e.date}T00:00:00Z`;
}

export const daysSince = (iso: string, now = Date.now()) => Math.max(0, Math.floor((now - Date.parse(iso)) / DAY));

export const bucketOf = (days: number): Bucket => (days <= 7 ? "0-7" : days <= 30 ? "8-30" : "30+");
