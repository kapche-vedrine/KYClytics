export type RiskBand = "GREEN" | "YELLOW" | "RED";
export type ReviewStatus = "OK" | "DUE_SOON" | "OVERDUE";

export interface RiskBreakdown {
  score: number;
  band: RiskBand;
  factors: string[];
  nextReviewMonths: number;
}

export const HIGH_RISK_COUNTRIES = ["Iran", "North Korea", "Syria", "Cuba", "Russia", "Afghanistan"];
export const HIGH_RISK_INDUSTRIES = ["Cryptocurrency", "Gambling", "Arms Dealer", "Precious Metals", "Casino"];
export const CASH_INTENSIVE_JOBS = ["Taxi Driver", "Waiter", "Construction Worker", "Street Vendor"];

export function calculateRisk(data: {
  pep: boolean;
  country: string;
  industry: string;
  job: string;
}): RiskBreakdown {
  let score = 0;
  const factors: string[] = [];

  if (data.pep) {
    score += 30;
    factors.push("Politically Exposed Person (+30)");
  }

  if (HIGH_RISK_COUNTRIES.includes(data.country)) {
    score += 20;
    factors.push(`High Risk Country: ${data.country} (+20)`);
  }

  if (HIGH_RISK_INDUSTRIES.includes(data.industry)) {
    score += 20;
    factors.push(`High Risk Industry: ${data.industry} (+20)`);
  }

  if (CASH_INTENSIVE_JOBS.includes(data.job)) {
    score += 10;
    factors.push(`Cash Intensive Job: ${data.job} (+10)`);
  }

  let band: RiskBand = "GREEN";
  let nextReviewMonths = 24;

  if (score >= 45) {
    band = "RED";
    nextReviewMonths = 6;
  } else if (score >= 25) {
    band = "YELLOW";
    nextReviewMonths = 12;
  }

  return { score, band, factors, nextReviewMonths };
}
