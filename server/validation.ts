import { z } from "zod";
import { CATEGORIES } from "../shared/types";

const money = z.number({ invalid_type_error: "must be a number" }).finite().positive().max(100_000_000);

const fields = {
  supplier: z.string().trim().min(2, "Supplier is required").max(120),
  category: z.enum(CATEGORIES),
  baselinePrice: money,
  negotiatedPrice: money,
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .refine((d) => { const t = new Date(`${d}T00:00:00Z`); return !isNaN(t.getTime()) && t.toISOString().startsWith(d); }, "Date is not a real calendar date")
    .refine((d) => d <= new Date().toISOString().slice(0, 10), "Date cannot be in the future"),
};

const belowBaseline = (e: { baselinePrice?: number; negotiatedPrice?: number }) =>
  e.baselinePrice === undefined || e.negotiatedPrice === undefined || e.negotiatedPrice < e.baselinePrice;

export const createEventSchema = z
  .object(fields)
  .strict()
  .refine(belowBaseline, { message: "Negotiated price must be below baseline price", path: ["negotiatedPrice"] });

export const updateEventSchema = z
  .object(fields)
  .partial()
  .strict();

export { belowBaseline };

export function formatZodError(err: z.ZodError): string {
  return err.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message)).join("; ");
}
