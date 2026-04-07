PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_edge_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`event` text NOT NULL,
	`details` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_edge_logs`("id", "event", "details", "created_at") SELECT "id", "event", "details", "created_at" FROM `edge_logs`;--> statement-breakpoint
DROP TABLE `edge_logs`;--> statement-breakpoint
ALTER TABLE `__new_edge_logs` RENAME TO `edge_logs`;--> statement-breakpoint
CREATE TABLE `__new_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`total` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_orders`("id", "user_id", "total", "status", "created_at") SELECT "id", "user_id", "total", "status", "created_at" FROM `orders`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price` real NOT NULL,
	`category` text NOT NULL,
	`image` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "description", "price", "category", "image", "stock", "status", "created_at") SELECT "id", "name", "description", "price", "category", "image", "stock", "status", "created_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
CREATE TABLE `__new_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`user_name` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`sentiment` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_reviews`("id", "product_id", "user_name", "rating", "comment", "sentiment", "created_at") SELECT "id", "product_id", "user_name", "rating", "comment", "sentiment", "created_at" FROM `reviews`;--> statement-breakpoint
DROP TABLE `reviews`;--> statement-breakpoint
ALTER TABLE `__new_reviews` RENAME TO `reviews`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "password", "name", "role", "created_at") SELECT "id", "username", "password", "name", "role", "created_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
PRAGMA foreign_keys=ON;