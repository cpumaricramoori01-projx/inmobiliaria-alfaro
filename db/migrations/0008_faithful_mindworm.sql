CREATE TABLE `inm_borradores` (
	`usuario_id` bigint unsigned NOT NULL,
	`clave` varchar(120) NOT NULL,
	`contenido` mediumtext NOT NULL,
	`actualizado` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inm_borradores_usuario_id_clave_pk` PRIMARY KEY(`usuario_id`,`clave`)
);
--> statement-breakpoint
ALTER TABLE `inm_borradores` ADD CONSTRAINT `inm_borradores_usuario_id_inm_usuarios_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `inm_usuarios`(`id`) ON DELETE cascade ON UPDATE no action;