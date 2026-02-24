CREATE TABLE "co_parent_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"owner_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"used_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "co_parent_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "co_parents" (
	"owner_id" text NOT NULL,
	"co_parent_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "co_parents_owner_id_co_parent_id_pk" PRIMARY KEY("owner_id","co_parent_id")
);
--> statement-breakpoint
ALTER TABLE "co_parent_invites" ADD CONSTRAINT "co_parent_invites_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "co_parent_invites" ADD CONSTRAINT "co_parent_invites_used_by_user_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "co_parents" ADD CONSTRAINT "co_parents_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "co_parents" ADD CONSTRAINT "co_parents_co_parent_id_user_id_fk" FOREIGN KEY ("co_parent_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;