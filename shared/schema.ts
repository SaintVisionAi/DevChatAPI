// Reference: javascript_log_in_with_replit and javascript_database blueprints
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'developer', 'viewer']);

// Chat mode enum
export const chatModeEnum = pgEnum('chat_mode', ['chat', 'search', 'research', 'code', 'voice']);

// User storage table - Simple DB authentication with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"), // For simple authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"), // Phone number
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('viewer').notNull(),
  organizationId: varchar("organization_id"), // For enterprise team members
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default('free'),
  subscriptionTier: varchar("subscription_tier").default('free'), // free, starter, pro, enterprise
  messageCount: integer("message_count").default(0), // Monthly message count
  messageLimit: integer("message_limit").default(100), // Monthly message limit
  lastResetAt: timestamp("last_reset_at").defaultNow(), // Last monthly reset
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Conversations table - EXTENDED MEMORY SYSTEM
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  model: varchar("model").notNull().default('claude-sonnet-4-5'),
  mode: chatModeEnum("mode").default('chat').notNull(),
  
  // Extended Memory Fields
  context: jsonb("context"), // User preferences, writing style, domain knowledge
  summary: text("summary"), // AI-generated conversation summary
  keyTopics: text("key_topics").array(), // Important topics discussed
  isShared: boolean("is_shared").default(false), // Team memory flag
  sharedWith: text("shared_with").array(), // User IDs who can access
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Messages table - ADVANCED FEATURES
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  model: varchar("model"),
  
  // Advanced Features
  searchResults: jsonb("search_results"), // Web search results with citations
  reasoning: text("reasoning"), // Chain-of-thought for deep research
  codeFiles: jsonb("code_files"), // Multi-file code edits
  voiceTranscript: text("voice_transcript"), // Original voice input
  attachments: jsonb("attachments"), // File uploads metadata
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// API Environments table
export const apiEnvironments = pgTable("api_environments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertApiEnvironmentSchema = createInsertSchema(apiEnvironments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertApiEnvironment = z.infer<typeof insertApiEnvironmentSchema>;
export type ApiEnvironment = typeof apiEnvironments.$inferSelect;

// Environment Variables table (encrypted)
export const environmentVariables = pgTable("environment_variables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  environmentId: varchar("environment_id").notNull().references(() => apiEnvironments.id, { onDelete: 'cascade' }),
  key: varchar("key").notNull(),
  value: text("value").notNull(), // Will be encrypted
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEnvironmentVariableSchema = createInsertSchema(environmentVariables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEnvironmentVariable = z.infer<typeof insertEnvironmentVariableSchema>;
export type EnvironmentVariable = typeof environmentVariables.$inferSelect;

// API Request History table
export const apiRequestHistory = pgTable("api_request_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  environmentId: varchar("environment_id").references(() => apiEnvironments.id, { onDelete: 'set null' }),
  method: varchar("method").notNull(),
  url: text("url").notNull(),
  headers: jsonb("headers"),
  body: text("body"),
  response: text("response"),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"), // in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApiRequestHistorySchema = createInsertSchema(apiRequestHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertApiRequestHistory = z.infer<typeof insertApiRequestHistorySchema>;
export type ApiRequestHistory = typeof apiRequestHistory.$inferSelect;

// Organizations table - Enterprise team subscriptions
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  
  // Subscription info
  subscriptionTier: varchar("subscription_tier").default('enterprise').notNull(),
  seatLimit: integer("seat_limit").default(5).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// Organization members table
export const organizationMembers = pgTable("organization_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar("role").default('member').notNull(), // 'owner', 'admin', 'member'
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers).omit({
  id: true,
  createdAt: true,
});

export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type OrganizationMember = typeof organizationMembers.$inferSelect;

// Verified domains table (max 5 per enterprise org)
export const verifiedDomains = pgTable("verified_domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  domain: varchar("domain").notNull(),
  isVerified: boolean("is_verified").default(false),
  verificationToken: varchar("verification_token"),
  
  createdAt: timestamp("created_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

export const insertVerifiedDomainSchema = createInsertSchema(verifiedDomains).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export type InsertVerifiedDomain = z.infer<typeof insertVerifiedDomainSchema>;
export type VerifiedDomain = typeof verifiedDomains.$inferSelect;

// TEAM MEMORY SYSTEM - Shared organizational knowledge
export const teamMemory = pgTable("team_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Memory Content
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  category: varchar("category"), // 'knowledge', 'procedure', 'context', 'preference'
  tags: text("tags").array(),
  
  // Access Control
  createdBy: varchar("created_by").notNull().references(() => users.id),
  sharedWith: text("shared_with").array(), // User IDs or 'all'
  isPublic: boolean("is_public").default(false),
  
  // Memory Metadata
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTeamMemorySchema = createInsertSchema(teamMemory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTeamMemory = z.infer<typeof insertTeamMemorySchema>;
export type TeamMemory = typeof teamMemory.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  apiEnvironments: many(apiEnvironments),
  apiRequestHistory: many(apiRequestHistory),
  teamMemories: many(teamMemory),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const apiEnvironmentsRelations = relations(apiEnvironments, ({ one, many }) => ({
  user: one(users, {
    fields: [apiEnvironments.userId],
    references: [users.id],
  }),
  variables: many(environmentVariables),
  requestHistory: many(apiRequestHistory),
}));

export const environmentVariablesRelations = relations(environmentVariables, ({ one }) => ({
  environment: one(apiEnvironments, {
    fields: [environmentVariables.environmentId],
    references: [apiEnvironments.id],
  }),
}));

export const apiRequestHistoryRelations = relations(apiRequestHistory, ({ one }) => ({
  user: one(users, {
    fields: [apiRequestHistory.userId],
    references: [users.id],
  }),
  environment: one(apiEnvironments, {
    fields: [apiRequestHistory.environmentId],
    references: [apiEnvironments.id],
  }),
}));

export const teamMemoryRelations = relations(teamMemory, ({ one }) => ({
  creator: one(users, {
    fields: [teamMemory.createdBy],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [teamMemory.organizationId],
    references: [organizations.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.ownerId],
    references: [users.id],
  }),
  members: many(organizationMembers),
  verifiedDomains: many(verifiedDomains),
  teamMemories: many(teamMemory),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

export const verifiedDomainsRelations = relations(verifiedDomains, ({ one }) => ({
  organization: one(organizations, {
    fields: [verifiedDomains.organizationId],
    references: [organizations.id],
  }),
}));
