CREATE TABLE `inm_sesiones` (
	`token_hash` varchar(64) NOT NULL,
	`usuario_id` bigint unsigned NOT NULL,
	`expira` timestamp NOT NULL,
	CONSTRAINT `inm_sesiones_token_hash` PRIMARY KEY(`token_hash`)
);
--> statement-breakpoint
ALTER TABLE `inm_usuarios` ADD `usuario` varchar(60);--> statement-breakpoint
ALTER TABLE `inm_usuarios` ADD `password_hash` varchar(255);--> statement-breakpoint
ALTER TABLE `inm_usuarios` ADD `intentos_fallidos` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `inm_usuarios` ADD `bloqueo_hasta` timestamp;--> statement-breakpoint
ALTER TABLE `inm_usuarios` ADD CONSTRAINT `uq_inm_usuarios_usuario` UNIQUE(`usuario`);--> statement-breakpoint
ALTER TABLE `inm_sesiones` ADD CONSTRAINT `inm_sesiones_usuario_id_inm_usuarios_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `inm_usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_inm_sesiones_usuario` ON `inm_sesiones` (`usuario_id`);--> statement-breakpoint
CREATE INDEX `idx_inm_sesiones_expira` ON `inm_sesiones` (`expira`);