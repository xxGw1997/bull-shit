CREATE TABLE `md5_file_list` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text,
	`md5` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
