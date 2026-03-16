CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"child_id" uuid,
	"goal_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_shop_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text DEFAULT '🎁' NOT NULL,
	"star_cost" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"shop_item_id" uuid NOT NULL,
	"star_cost" integer NOT NULL,
	"purchased_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"child_id" uuid NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_star_date" text
);
--> statement-breakpoint
ALTER TABLE "star_events" ADD COLUMN "quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_shop_items" ADD CONSTRAINT "reward_shop_items_parent_id_user_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_purchases" ADD CONSTRAINT "shop_purchases_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_purchases" ADD CONSTRAINT "shop_purchases_shop_item_id_reward_shop_items_id_fk" FOREIGN KEY ("shop_item_id") REFERENCES "public"."reward_shop_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id_is_read" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_reward_shop_items_parent_id" ON "reward_shop_items" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_shop_purchases_child_id" ON "shop_purchases" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "idx_streaks_goal_id" ON "streaks" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "idx_streaks_child_id" ON "streaks" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "idx_children_parent_id" ON "children" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_co_parent_invites_owner_id" ON "co_parent_invites" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_co_parents_co_parent_id" ON "co_parents" USING btree ("co_parent_id");--> statement-breakpoint
CREATE INDEX "idx_goals_child_id_is_active" ON "goals" USING btree ("child_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_reward_redemptions_goal_id" ON "reward_redemptions" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "idx_star_events_goal_id" ON "star_events" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "idx_star_requests_goal_id" ON "star_requests" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "idx_star_requests_child_id_status" ON "star_requests" USING btree ("child_id","status");