// FY27 cost center table from Finance (synthetic codes). Approvals made on or after
// the FY27 cutover are booked against these. Seeded history keeps its FY26 codes.
export const FY27_COST_CENTERS: Record<string, string> = {
  "Network Equipment": "CC-5100-NET",
  "Fleet Services": "CC-5200-FLS",
  Facilities: "CC-5300-FAC",
  "IT Services": "CC-5400-ITS",
};
