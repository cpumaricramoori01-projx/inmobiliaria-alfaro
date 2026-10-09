CREATE TABLE IF NOT EXISTS inm_tipos_inmueble (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_tipos_inmueble_nombre (nombre)
);
INSERT IGNORE INTO inm_tipos_inmueble (nombre)
SELECT defaults.nombre FROM (
  SELECT 'Casa' nombre UNION ALL SELECT 'Departamento' UNION ALL SELECT 'Terreno'
  UNION ALL SELECT 'Local' UNION ALL SELECT 'Oficina' UNION ALL SELECT 'Otros'
) defaults WHERE NOT EXISTS (SELECT 1 FROM inm_tipos_inmueble);
INSERT IGNORE INTO inm_tipos_inmueble (nombre)
SELECT DISTINCT TRIM(tipo) FROM inm_inmuebles WHERE TRIM(tipo) <> '';
