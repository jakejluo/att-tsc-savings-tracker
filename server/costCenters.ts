import { Category } from "../shared/types";
import { FY27_COST_CENTERS } from "./finance/fy27CostCenters";

// Finance cost centers that approved savings are booked against (synthetic codes).
const COST_CENTERS: Record<Category, string> = {
  "Network Equipment": "CC-4100-NET",
  Fleet: "CC-4200-FLT",
  Facilities: "CC-4300-FAC",
  "IT Services": "CC-4400-ITS",
};

export function costCenterFor(category: Category): string {
  const code = COST_CENTERS[category];
  if (!code) throw new Error(`No cost center mapped for category "${category}"`);
  return code;
}

export function fy27CostCenterFor(category: Category): string {
  const code = FY27_COST_CENTERS[category];
  if (!code) throw new Error(`No FY27 cost center mapped for category "${category}"`);
  return code;
}
