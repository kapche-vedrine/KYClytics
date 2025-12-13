import { type User, type InsertUser, type Client, type InsertClient, type Document, type InsertDocument, type RiskConfig } from "@shared/schema";
import { db } from "./db";
import { users, clients, documents, riskConfig } from "@shared/schema";
import { eq, or, ilike } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Clients
  getClients(filters?: { riskBand?: string; search?: string }): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  
  // Documents
  getClientDocuments(clientId: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<boolean>;
  
  // Risk Config
  getRiskConfig(): Promise<RiskConfig | undefined>;
  updateRiskConfig(config: Partial<RiskConfig>): Promise<RiskConfig>;
}

export class DrizzleStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getClients(filters?: { riskBand?: string; search?: string }): Promise<Client[]> {
    let query = db.select().from(clients);
    
    if (filters?.riskBand && filters.riskBand !== "ALL") {
      query = query.where(eq(clients.band, filters.riskBand as any));
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.where(
        or(
          ilike(clients.firstName, searchTerm),
          ilike(clients.lastName, searchTerm)
        )
      );
    }
    
    return query;
  }

  async getClient(id: string): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id));
    return result[0];
  }

  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values(client).returning();
    return result[0];
  }

  async updateClient(id: string, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db.update(clients)
      .set({ ...clientData, lastUpdated: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return result[0];
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id)).returning();
    return result.length > 0;
  }

  async getClientDocuments(clientId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.clientId, clientId));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id));
    return result[0];
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(document).returning();
    return result[0];
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id)).returning();
    return result.length > 0;
  }

  async getRiskConfig(): Promise<RiskConfig | undefined> {
    const result = await db.select().from(riskConfig).limit(1);
    return result[0];
  }

  async updateRiskConfig(config: Partial<RiskConfig>): Promise<RiskConfig> {
    const existing = await this.getRiskConfig();
    
    if (existing) {
      const result = await db.update(riskConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(riskConfig.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(riskConfig).values(config as any).returning();
      return result[0];
    }
  }
}

export const storage = new DrizzleStorage();
