CREATE TABLE "sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"story_id" integer NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"source_message_ids" integer[] DEFAULT '{}' NOT NULL,
	"source_quote" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"verification_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "source_name" text;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "message_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;