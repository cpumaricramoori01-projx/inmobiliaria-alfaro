ALTER TABLE `inm_inmuebles` ADD `operacion` varchar(10) DEFAULT 'venta' NOT NULL;--> statement-breakpoint
ALTER TABLE `inm_liberaciones` ADD `fecha_alquiler` date;--> statement-breakpoint
ALTER TABLE `inm_liberaciones` ADD `renta_mensual` decimal(15,2);--> statement-breakpoint
ALTER TABLE `inm_liberaciones` ADD `garantia` decimal(15,2);--> statement-breakpoint
ALTER TABLE `inm_liberaciones` ADD `adelanto` decimal(15,2);--> statement-breakpoint
ALTER TABLE `inm_liberaciones` ADD `fecha_inicio_alquiler` date;--> statement-breakpoint
ALTER TABLE `inm_liberaciones` ADD `fecha_fin_alquiler` date;