ALTER TABLE `inm_liberaciones` ADD `fecha_venta` date;
--> statement-breakpoint
ALTER TABLE `inm_liberaciones` ADD `precio_final` decimal(15,2);
--> statement-breakpoint
ALTER TABLE `inm_liberaciones` ADD `comision` decimal(15,2);
--> statement-breakpoint
ALTER TABLE `inm_liberaciones` ADD `datos_simulados` boolean DEFAULT false NOT NULL;
