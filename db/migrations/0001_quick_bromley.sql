CREATE TABLE `inm_negociaciones` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`inmueble_id` bigint unsigned NOT NULL,
	`estado` varchar(20) NOT NULL DEFAULT 'en_curso',
	`fecha_inicio` timestamp NOT NULL DEFAULT (now()),
	`fecha_fin` timestamp,
	`observaciones` text,
	`usuario_id` bigint unsigned NOT NULL,
	`fecha_registro` timestamp NOT NULL DEFAULT (now()),
	`fecha_actualizacion` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inm_negociaciones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `inm_inmuebles` MODIFY COLUMN `propietario_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `inm_negociaciones` ADD CONSTRAINT `inm_negociaciones_inmueble_id_inm_inmuebles_id_fk` FOREIGN KEY (`inmueble_id`) REFERENCES `inm_inmuebles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_negociaciones` ADD CONSTRAINT `inm_negociaciones_usuario_id_inm_usuarios_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `inm_usuarios`(`id`) ON DELETE no action ON UPDATE no action;