import { db } from "./db";
import { users, clients, riskConfig } from "@shared/schema";
import { hashPassword } from "./auth";
import { DEFAULT_RISK_CONFIG } from "../client/src/lib/risk-engine";

async function seed() {
  console.log("Seeding database...");
  
  // Create admin user
  const hashedPassword = await hashPassword("admin123");
  await db.insert(users).values({
    email: "admin@kyclytics.com",
    password: hashedPassword,
    name: "Admin User",
    role: "ADMIN"
  }).onConflictDoNothing();
  
  console.log("✓ Admin user created (admin@kyclytics.com / admin123)");
  
  // Create risk config
  await db.insert(riskConfig).values({
    pepWeight: DEFAULT_RISK_CONFIG.weights.pep,
    highRiskCountryWeight: DEFAULT_RISK_CONFIG.weights.highRiskCountry,
    highRiskIndustryWeight: DEFAULT_RISK_CONFIG.weights.highRiskIndustry,
    cashIntensiveJobWeight: DEFAULT_RISK_CONFIG.weights.cashIntensiveJob,
    mediumThreshold: DEFAULT_RISK_CONFIG.thresholds.medium,
    highThreshold: DEFAULT_RISK_CONFIG.thresholds.high,
    highRiskCountries: DEFAULT_RISK_CONFIG.highRiskCountries,
    highRiskIndustries: DEFAULT_RISK_CONFIG.highRiskIndustries,
    cashIntensiveJobs: DEFAULT_RISK_CONFIG.cashIntensiveJobs
  }).onConflictDoNothing();
  
  console.log("✓ Risk configuration initialized");
  
  // Create sample clients
  const sampleClients = [
    {
      firstName: "Alice",
      lastName: "Thompson",
      dob: "1985-04-12",
      address: "123 Maple Ave, London",
      country: "United Kingdom",
      postalCode: "SW1A 1AA",
      job: "Software Engineer",
      industry: "Technology",
      pep: false,
      score: 0,
      band: "GREEN" as const,
      status: "OK" as const,
      nextReview: new Date(Date.now() + 20 * 30 * 24 * 60 * 60 * 1000)
    },
    {
      firstName: "Boris",
      lastName: "Ivanov",
      dob: "1978-11-23",
      address: "456 High St, Moscow",
      country: "Russia",
      postalCode: "101000",
      job: "CEO",
      industry: "Oil & Gas",
      pep: true,
      score: 50,
      band: "RED" as const,
      status: "DUE_SOON" as const,
      nextReview: new Date(Date.now() + 1 * 30 * 24 * 60 * 60 * 1000)
    }
  ];
  
  for (const client of sampleClients) {
    await db.insert(clients).values(client).onConflictDoNothing();
  }
  
  console.log("✓ Sample clients created");
  console.log("\nDatabase seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
