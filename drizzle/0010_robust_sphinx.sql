CREATE TABLE "child_wishlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"name" text NOT NULL,
	"emoji" text DEFAULT '🎁' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_star_cost" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "child_wishlist_items" ADD CONSTRAINT "child_wishlist_items_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_child_wishlist_items_child_id" ON "child_wishlist_items" USING btree ("child_id");