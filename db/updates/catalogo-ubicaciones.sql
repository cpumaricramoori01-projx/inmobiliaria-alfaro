CREATE TABLE IF NOT EXISTS `inm_ubicaciones` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`nivel` varchar(20) NOT NULL,
	`nombre` varchar(100) NOT NULL,
	`padre_id` bigint unsigned,
	`activo` boolean NOT NULL DEFAULT true,
	CONSTRAINT `inm_ubicaciones_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_ubicaciones_nombre` UNIQUE(`nivel`,`padre_id`,`nombre`)
);


CREATE INDEX `idx_ubicaciones_padre` ON `inm_ubicaciones` (`padre_id`);