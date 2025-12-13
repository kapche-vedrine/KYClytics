import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("COMPLIANCE_OFFICER"),
});

export const riskBandEnum = pgEnum("risk_band", ["GREEN", "YELLOW", "RED"]);
export const reviewStatusEnum = pgEnum("review_status", ["OK", "DUE_SOON", "OVERDUE"]);

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dob: text("dob").notNull(),
  address: text("address").notNull(),
  country: text("country").notNull(),
  postalCode: text("postal_code").notNull(),
  job: text("job").notNull(),
  industry: text("industry").notNull(),
  pep: boolean("pep").notNull().default(false),
  score: integer("score").notNull().default(0),
  band: riskBandEnum("band").notNull().default("GREEN"),
  status: reviewStatusEnum("status").notNull().default("OK"),
  nextReview: timestamp("next_review").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  size: text("size").notNull(),
  type: text("type").notNull(),
  path: text("path").notNull(),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("light"),
  primaryColor: text("primary_color").notNull().default("#1e40af"),
  dashboardWidgets: text("dashboard_widgets").array().notNull().default(sql`ARRAY['stats', 'riskChart', 'priorityReviews', 'recentActivity']`),
  widgetLayout: text("widget_layout").notNull().default('default'),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const riskConfig = pgTable("risk_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pepWeight: integer("pep_weight").notNull().default(30),
  highRiskCountryWeight: integer("high_risk_country_weight").notNull().default(20),
  highRiskIndustryWeight: integer("high_risk_industry_weight").notNull().default(20),
  cashIntensiveJobWeight: integer("cash_intensive_job_weight").notNull().default(10),
  mediumThreshold: integer("medium_threshold").notNull().default(25),
  highThreshold: integer("high_threshold").notNull().default(45),
  highRiskCountries: text("high_risk_countries").array().notNull(),
  highRiskIndustries: text("high_risk_industries").array().notNull(),
  cashIntensiveJobs: text("cash_intensive_jobs").array().notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  score: true,
  band: true,
  status: true,
  nextReview: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadDate: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type RiskConfig = typeof riskConfig.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
