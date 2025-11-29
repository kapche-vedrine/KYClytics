export type RiskBand = "GREEN" | "YELLOW" | "RED";
export type ReviewStatus = "OK" | "DUE_SOON" | "OVERDUE";

export interface RiskBreakdown {
  score: number;
  band: RiskBand;
  factors: string[];
  nextReviewMonths: number;
}

export interface RiskConfig {
  weights: {
    pep: number;
    highRiskCountry: number;
    highRiskIndustry: number;
    cashIntensiveJob: number;
  };
  highRiskCountries: string[];
  highRiskIndustries: string[];
  cashIntensiveJobs: string[];
  thresholds: {
    medium: number;
    high: number;
  };
}

export const ALL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

export const ALL_INDUSTRIES = [
  "Agriculture", "Aerospace", "Automotive", "Banking", "Construction", "Consulting", "Cryptocurrency", "Defense", "Education", "Energy", "Entertainment", "Fashion", "Financial Services", "Food & Beverage", "Gambling", "Government", "Healthcare", "Hospitality", "Insurance", "Legal", "Manufacturing", "Media", "Mining", "Non-Profit", "Oil & Gas", "Pharmaceuticals", "Precious Metals", "Real Estate", "Retail", "Technology", "Telecommunications", "Transportation", "Travel"
];

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  weights: {
    pep: 30,
    highRiskCountry: 20,
    highRiskIndustry: 20,
    cashIntensiveJob: 10,
  },
  highRiskCountries: ["Iran", "North Korea", "Syria", "Cuba", "Russia", "Afghanistan", "Venezuela", "Myanmar", "Yemen"],
  highRiskIndustries: ["Cryptocurrency", "Gambling", "Arms Dealer", "Precious Metals", "Casino", "Defense", "Mining"],
  cashIntensiveJobs: ["Taxi Driver", "Waiter", "Construction Worker", "Street Vendor", "Bartender"],
  thresholds: {
    medium: 25,
    high: 45,
  }
};

export function calculateRisk(
  data: {
    pep: boolean;
    country: string;
    industry: string;
    job: string;
  },
  config: RiskConfig = DEFAULT_RISK_CONFIG
): RiskBreakdown {
  let score = 0;
  const factors: string[] = [];

  if (data.pep) {
    score += config.weights.pep;
    factors.push(`Politically Exposed Person (+${config.weights.pep})`);
  }

  if (config.highRiskCountries.includes(data.country)) {
    score += config.weights.highRiskCountry;
    factors.push(`High Risk Country: ${data.country} (+${config.weights.highRiskCountry})`);
  }

  if (config.highRiskIndustries.includes(data.industry)) {
    score += config.weights.highRiskIndustry;
    factors.push(`High Risk Industry: ${data.industry} (+${config.weights.highRiskIndustry})`);
  }

  if (config.cashIntensiveJobs.some(job => data.job.toLowerCase().includes(job.toLowerCase()))) {
    score += config.weights.cashIntensiveJob;
    factors.push(`Cash Intensive Job: ${data.job} (+${config.weights.cashIntensiveJob})`);
  }

  let band: RiskBand = "GREEN";
  let nextReviewMonths = 24;

  if (score >= config.thresholds.high) {
    band = "RED";
    nextReviewMonths = 6;
  } else if (score >= config.thresholds.medium) {
    band = "YELLOW";
    nextReviewMonths = 12;
  }

  return { score, band, factors, nextReviewMonths };
}
