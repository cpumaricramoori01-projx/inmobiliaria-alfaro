CREATE TABLE `inm_auth_challenges` (
	`token_hash` varchar(64) NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`secret` varchar(255),
	`expires` timestamp NOT NULL,
	CONSTRAINT `inm_auth_challenges_token_hash` PRIMARY KEY(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `inm_auth_limits` (
	`bucket_key` varchar(64) NOT NULL,
	`hits` int unsigned NOT NULL,
	`expires` datetime NOT NULL,
	CONSTRAINT `inm_auth_limits_bucket_key` PRIMARY KEY(`bucket_key`)
);
--> statement-breakpoint
CREATE TABLE `inm_anuncios` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`inmueble_id` bigint unsigned NOT NULL,
	`canal` varchar(80) NOT NULL,
	`enlace` varchar(1000) NOT NULL,
	`fecha_publicacion` date NOT NULL,
	`precio_publicado` decimal(15,2) NOT NULL,
	`actualizado` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inm_anuncios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inm_seguimiento` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`inmueble_id` bigint unsigned NOT NULL,
	`actividad` varchar(30) NOT NULL,
	`responsable_id` bigint unsigned,
	`fecha_limite` date,
	`observacion` varchar(500),
	`actualizado` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inm_seguimiento_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_seguimiento_actividad` UNIQUE(`inmueble_id`,`actividad`)
);
--> statement-breakpoint
CREATE TABLE `inm_security_audit` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`actor_id` bigint unsigned,
	`action` varchar(60) NOT NULL,
	`resource` varchar(120) NOT NULL,
	`outcome` varchar(20) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inm_security_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `inm_inmuebles` ADD `datos_prueba` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `inm_inmuebles` ADD `datos_validados` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `inm_inmuebles` ADD `latitud` decimal(10,7);--> statement-breakpoint
ALTER TABLE `inm_inmuebles` ADD `longitud` decimal(10,7);--> statement-breakpoint
ALTER TABLE `inm_sesiones` ADD `last_seen` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `inm_sesiones` ADD `authenticated_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `inm_usuarios` ADD `mfa_secret` varchar(255);--> statement-breakpoint
ALTER TABLE `inm_usuarios` ADD `mfa_last_step` bigint;--> statement-breakpoint
ALTER TABLE `inm_auth_challenges` ADD CONSTRAINT `inm_auth_challenges_user_id_inm_usuarios_id_fk` FOREIGN KEY (`user_id`) REFERENCES `inm_usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_anuncios` ADD CONSTRAINT `inm_anuncios_inmueble_id_inm_inmuebles_id_fk` FOREIGN KEY (`inmueble_id`) REFERENCES `inm_inmuebles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_seguimiento` ADD CONSTRAINT `inm_seguimiento_inmueble_id_inm_inmuebles_id_fk` FOREIGN KEY (`inmueble_id`) REFERENCES `inm_inmuebles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_seguimiento` ADD CONSTRAINT `inm_seguimiento_responsable_id_inm_usuarios_id_fk` FOREIGN KEY (`responsable_id`) REFERENCES `inm_usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_anuncios_inmueble` ON `inm_anuncios` (`inmueble_id`);