ALTER TABLE `inm_archivos` ADD `almacenamiento` varchar(20) DEFAULT 'enlace' NOT NULL;--> statement-breakpoint
ALTER TABLE `inm_archivos` ADD `ruta_almacenamiento` varchar(1000);--> statement-breakpoint
ALTER TABLE `inm_archivos` ADD `nombre_original` varchar(255);--> statement-breakpoint
ALTER TABLE `inm_archivos` ADD `tamano_bytes` bigint unsigned;--> statement-breakpoint
ALTER TABLE `inm_archivos` ADD `tipo_mime` varchar(150);