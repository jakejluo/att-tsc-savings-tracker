import { SavingsEvent } from "./types";
import { seedEvents } from "./seed";

const KEY = "tsc-savings-events";

export function loadEvents(): SavingsEvent[] {
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  const seeded = seedEvents();
  saveEvents(seeded);
  return seeded;
}

export function saveEvents(events: SavingsEvent[]) {
  localStorage.setItem(KEY, JSON.stringify(events));
}
