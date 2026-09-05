CREATE TABLE `invitations` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_hash` text NOT NULL,
	`token_hash` text,
	`mode` text NOT NULL,
	`condition` text NOT NULL,
	`version` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`age` integer,
	`gender` text,
	`state` text NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text,
	`completion_code` text,
	`submission_key` text,
	`last_action_id` text,
	`metrics` text,
	FOREIGN KEY (`token_hash`) REFERENCES `invitations`(`token_hash`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_auth_hash_unique` ON `sessions` (`auth_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_submission_key_unique` ON `sessions` (`submission_key`);--> statement-breakpoint
CREATE INDEX `idx_sessions_mode_status` ON `sessions` (`mode`,`status`);