import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  sourceName: text("source_name"),
  messageCount: integer("message_count").notNull().default(0),
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
  status: text("status").notNull().default("pending"),
  verificationNote: text("verification_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
