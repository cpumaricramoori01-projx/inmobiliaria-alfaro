CREATE TABLE IF NOT EXISTS `inm_tipos_inmueble` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`nombre` varchar(30) NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	CONSTRAINT `inm_tipos_inmueble_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_tipos_inmueble_nombre` UNIQUE(`nombre`)
);
--> statement-breakpoint
INSERT IGNORE INTO inm_tipos_inmueble (nombre)
SELECT defaults.nombre FROM (
  SELECT 'Casa' nombre UNION ALL SELECT 'Departamento' UNION ALL SELECT 'Terreno'
  UNION ALL SELECT 'Local' UNION ALL SELECT 'Oficina' UNION ALL SELECT 'Otros'
) defaults WHERE NOT EXISTS (SELECT 1 FROM inm_tipos_inmueble);
--> statement-breakpoint
INSERT IGNORE INTO inm_tipos_inmueble (nombre)
SELECT DISTINCT TRIM(tipo) FROM inm_inmuebles WHERE TRIM(tipo) <> '';