ALTER TABLE `inm_archivos` ADD `visita_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `inm_archivos` ADD `es_portada` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `inm_archivos` ADD CONSTRAINT `inm_archivos_visita_id_inm_visitas_id_fk` FOREIGN KEY (`visita_id`) REFERENCES `inm_visitas`(`id`) ON DELETE no action ON UPDATE no action;