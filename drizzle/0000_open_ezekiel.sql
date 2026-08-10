CREATE TABLE `crypto_details` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`symbol` text NOT NULL,
	`market` text NOT NULL,
	`price` real NOT NULL,
	`created_time` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `crypto_index` ON `crypto_details` (`symbol`,`market`,`created_time`);--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chat_id` integer NOT NULL,
	`symbol` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `favorites_index` ON `favorites` (`chat_id`,`symbol`);