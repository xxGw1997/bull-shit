CREATE TABLE `conversation` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`status` text DEFAULT 'active' NOT NULL,
	`user_id` text,
	`model` text,
	`system` text,
	`metadata` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	CONSTRAINT "conversation_metadata_json_valid" CHECK("conversation"."metadata" is null or json_valid("conversation"."metadata"))
);
--> statement-breakpoint
CREATE INDEX `conversation_user_id_idx` ON `conversation` (`user_id`);--> statement-breakpoint
CREATE INDEX `conversation_status_idx` ON `conversation` (`status`);--> statement-breakpoint
CREATE TABLE `message` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`sequence` integer NOT NULL,
	`content_json` text NOT NULL,
	`text` text,
	`provider_metadata` text,
	`metadata` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversation`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "message_content_json_valid" CHECK(json_valid("message"."content_json")),
	CONSTRAINT "message_provider_metadata_json_valid" CHECK("message"."provider_metadata" is null or json_valid("message"."provider_metadata")),
	CONSTRAINT "message_metadata_json_valid" CHECK("message"."metadata" is null or json_valid("message"."metadata"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `message_conversation_sequence_unique` ON `message` (`conversation_id`,`sequence`);--> statement-breakpoint
CREATE INDEX `message_conversation_id_idx` ON `message` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `message_role_idx` ON `message` (`role`);