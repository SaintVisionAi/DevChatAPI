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

// User storage table - required for Replit Auth with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('viewer').notNull(),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default('free'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Conversations table
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  model: varchar("model").notNull().default('claude-sonnet-4-5'),
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

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  model: varchar("model"),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  apiEnvironments: many(apiEnvironments),
  apiRequestHistory: many(apiRequestHistory),
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
