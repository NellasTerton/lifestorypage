import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  /** Nullable: story #1 predates accounts, and a story stays readable regardless. */
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  sourceName: text("source_name"),
  /**
   * All message texts joined, kept so a quote can be checked against the
   * original mechanically. Without it the source is gone after upload and
   * "does this quote exist" can only be answered by hand.
   */
  sourceText: text("source_text"),
  messageCount: integer("message_count").notNull().default(0),
  /** `processing` while the LLM stages run, then `ready`. */
  status: text("status").notNull().default("ready"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  content: text("content").notNull(),
  sourceMessageIds: integer("source_message_ids").array().notNull().default([]),
  sourceQuote: text("source_quote"),
  /** Date of the earliest cited message, denormalised so rendering needs no chat file. */
  sourceDate: timestamp("source_date"),
  status: text("status").notNull().default("pending"),
  verificationNote: text("verification_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
