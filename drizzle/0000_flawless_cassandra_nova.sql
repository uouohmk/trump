CREATE TABLE `profiles` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`input` text NOT NULL,
	`chart` text NOT NULL,
	`guide` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `readings` (
	`owner_id` text NOT NULL,
	`profile_version` text NOT NULL,
	`day` text NOT NULL,
	`payload` text NOT NULL,
	PRIMARY KEY(`owner_id`, `profile_version`, `day`)
);
