import { CATEGORIES, SavingsEvent } from "./types";

// Synthetic suppliers and people. Not real AT&T vendors, staff or numbers.
const SUPPLIERS = [
  "Northwind Networks", "Contoso Fiber", "Fabrikam Fleet", "Tailspin Facilities",
  "Litware IT", "Adatum Radio", "Proseware Vehicles", "Woodgrove Services",
  "Lucerne Data", "Wingtip Towers",
];
const MANAGERS = ["sam.rivera", "priya.shah", "jordan.lee"];

function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
}

export function seedEvents(count = 100): Omit<SavingsEvent, "costCenter">[] {
  const rand = rng(42);
  return Array.from({ length: count }, (_, i) => {
    const baseline = Math.round(5000 + rand() * 95000);
    const discount = 0.03 + rand() * 0.22;
    const day = new Date(Date.UTC(2026, 0, 1) + Math.floor(rand() * 290) * 86400000);
    const approved = rand() < 0.6;
    return {
      id: i + 1,
      supplier: SUPPLIERS[Math.floor(rand() * SUPPLIERS.length)],
      category: CATEGORIES[Math.floor(rand() * CATEGORIES.length)],
      baselinePrice: baseline,
      negotiatedPrice: Math.round(baseline * (1 - discount)),
      date: day.toISOString().slice(0, 10),
      status: approved ? "approved" : "pending",
      createdBy: MANAGERS[i % MANAGERS.length],
      approvedBy: approved ? "alex.chen" : null,
    };
  });
}
