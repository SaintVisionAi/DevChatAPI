// Reference: javascript_database blueprint
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import type {
  User,
  UpsertUser,
  Conversation,
  InsertConversation,
  Message,
  InsertMessage,
  ApiEnvironment,
  InsertApiEnvironment,
  EnvironmentVariable,
  InsertEnvironmentVariable,
  ApiRequestHistory,
  InsertApiRequestHistory,
} from "@shared/schema";
import {
  users,
  conversations,
  messages,
  apiEnvironments,
  environmentVariables,
  apiRequestHistory,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  // Users
  upsertUser(user: UpsertUser): Promise<User>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Conversations
  createConversation(data: InsertConversation): Promise<Conversation>;
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
  getConversationById(id: string): Promise<Conversation | undefined>;
  updateConversation(id: string, updates: {
    title?: string;
    context?: any;
    summary?: string;
    keyTopics?: string[];
    isShared?: boolean;
    sharedWith?: string[];
  }): Promise<void>;
  deleteConversation(id: string): Promise<void>;

  // Messages
  createMessage(data: InsertMessage): Promise<Message>;
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;

  // API Environments
  createEnvironment(data: InsertApiEnvironment): Promise<ApiEnvironment>;
  getEnvironmentsByUserId(userId: string): Promise<ApiEnvironment[]>;
  getEnvironmentById(id: string): Promise<ApiEnvironment | undefined>;
  deleteEnvironment(id: string): Promise<void>;

  // Environment Variables
  createVariable(data: InsertEnvironmentVariable): Promise<EnvironmentVariable>;
  getVariablesByEnvironmentId(environmentId: string): Promise<EnvironmentVariable[]>;
  updateVariable(id: string, value: string): Promise<void>;
  deleteVariable(id: string): Promise<void>;

  // API Request History
  createRequestHistory(data: InsertApiRequestHistory): Promise<ApiRequestHistory>;
  getRequestHistoryByUserId(userId: string, limit?: number): Promise<ApiRequestHistory[]>;

  // Stats
  getUserStats(userId: string): Promise<any>;
  getAdminStats(): Promise<any>;
  getAllUsers(): Promise<User[]>;
}

export class DbStorage implements IStorage {
  // Users
  async upsertUser(user: UpsertUser): Promise<User> {
    // ✅ CORRECT FIX: UPSERT on primary key (id/sub) only
    // NEVER change the primary key - it breaks foreign key relationships
    // The OIDC `sub` (user.id) is the stable identifier
    // If email already exists with different sub, PostgreSQL will throw unique constraint error
    try {
      const [result] = await db
        .insert(users)
        .values(user)
        .onConflictDoUpdate({
          target: users.id, // Conflict on sub (primary key)
          set: {
            email: user.email, // Update email if user logs in again
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            updatedAt: new Date(),
          },
        })
        .returning();
      return result;
    } catch (error: any) {
      // If email unique constraint is violated, it means:
      // - Same email trying to log in with different OIDC sub
      // - This could be a duplicate account or account takeover attempt
      if (error.code === '23505' && error.constraint === 'users_email_unique') {
        console.error(`[upsertUser] Email conflict: ${user.email} already exists with different OIDC sub`);
        console.error(`[upsertUser] Attempted sub: ${user.id}, Error: ${error.message}`);
        // Re-throw with clearer message
        throw new Error(`This email is already associated with another account. Please use a different email or contact support.`);
      }
      // Re-throw other errors
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  // Conversations
  async createConversation(data: InsertConversation): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values(data).returning();
    return conversation;
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversationById(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);
    return conversation;
  }

  async updateConversation(id: string, updates: {
    title?: string;
    context?: any;
    summary?: string;
    keyTopics?: string[];
    isShared?: boolean;
    sharedWith?: string[];
  }): Promise<void> {
    await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id));
  }

  async deleteConversation(id: string): Promise<void> {
    // Delete all messages in the conversation first
    await db.delete(messages).where(eq(messages.conversationId, id));
    // Then delete the conversation
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  // Messages
  async createMessage(data: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(data).returning();
    
    // Update conversation's updatedAt
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, data.conversationId));
    
    return message;
  }

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  // API Environments
  async createEnvironment(data: InsertApiEnvironment): Promise<ApiEnvironment> {
    const [environment] = await db.insert(apiEnvironments).values(data).returning();
    return environment;
  }

  async getEnvironmentsByUserId(userId: string): Promise<ApiEnvironment[]> {
    return await db
      .select()
      .from(apiEnvironments)
      .where(eq(apiEnvironments.userId, userId))
      .orderBy(desc(apiEnvironments.createdAt));
  }

  async getEnvironmentById(id: string): Promise<ApiEnvironment | undefined> {
    const [environment] = await db
      .select()
      .from(apiEnvironments)
      .where(eq(apiEnvironments.id, id))
      .limit(1);
    return environment;
  }

  async deleteEnvironment(id: string): Promise<void> {
    await db.delete(apiEnvironments).where(eq(apiEnvironments.id, id));
  }

  // Environment Variables
  async createVariable(data: InsertEnvironmentVariable): Promise<EnvironmentVariable> {
    const [variable] = await db.insert(environmentVariables).values(data).returning();
    return variable;
  }

  async getVariablesByEnvironmentId(environmentId: string): Promise<EnvironmentVariable[]> {
    return await db
      .select()
      .from(environmentVariables)
      .where(eq(environmentVariables.environmentId, environmentId));
  }

  async updateVariable(id: string, value: string): Promise<void> {
    await db
      .update(environmentVariables)
      .set({ value, updatedAt: new Date() })
      .where(eq(environmentVariables.id, id));
  }

  async deleteVariable(id: string): Promise<void> {
    await db.delete(environmentVariables).where(eq(environmentVariables.id, id));
  }

  // API Request History
  async createRequestHistory(data: InsertApiRequestHistory): Promise<ApiRequestHistory> {
    const [history] = await db.insert(apiRequestHistory).values(data).returning();
    return history;
  }

  async getRequestHistoryByUserId(
    userId: string,
    limit: number = 50
  ): Promise<ApiRequestHistory[]> {
    return await db
      .select()
      .from(apiRequestHistory)
      .where(eq(apiRequestHistory.userId, userId))
      .orderBy(desc(apiRequestHistory.createdAt))
      .limit(limit);
  }

  // Stats
  async getUserStats(userId: string): Promise<any> {
    const conversationCount = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId));

    const allConversationIds = conversationCount.map((c) => c.id);
    let messageCount = 0;
    if (allConversationIds.length > 0) {
      const msgs = await db.select().from(messages);
      messageCount = msgs.filter((m) =>
        allConversationIds.includes(m.conversationId)
      ).length;
    }

    const apiCalls = await db
      .select()
      .from(apiRequestHistory)
      .where(eq(apiRequestHistory.userId, userId));

    return {
      conversationCount: conversationCount.length,
      messageCount,
      apiCallCount: apiCalls.length,
      usagePercentage: 0, // Calculate based on plan limits
    };
  }

  async getAdminStats(): Promise<any> {
    const allUsers = await db.select().from(users);
    const allConversations = await db.select().from(conversations);
    const allApiCalls = await db.select().from(apiRequestHistory);

    return {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter((u) => u.updatedAt).length,
      totalConversations: allConversations.length,
      totalApiCalls: allApiCalls.length,
    };
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
}

export const storage = new DbStorage();
