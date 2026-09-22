-- Modelo inicial de datos para Inmobiliaria Alberto Alfaro EIRL.
-- IMPORTANTE: todas las tablas usan prefijo inm_ y son independientes de cualquier tabla del Censo Hospitalario.
-- Esta etapa solo documenta el modelo. No crea ni modifica tablas en la base de datos.

CREATE TABLE inm_usuarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  rol VARCHAR(30) NOT NULL DEFAULT 'usuario',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inm_usuarios_email (email)
);

CREATE TABLE inm_propietarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dni VARCHAR(20) NOT NULL,
  nombres VARCHAR(120) NOT NULL,
  apellidos VARCHAR(160) NOT NULL,
  telefono VARCHAR(40) NULL,
  email VARCHAR(160) NULL,
  referencia_contacto VARCHAR(255) NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inm_propietarios_dni (dni)
);

CREATE TABLE inm_inmuebles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(30) NOT NULL,
  propietario_id BIGINT UNSIGNED NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  referencia VARCHAR(255) NOT NULL,
  direccion VARCHAR(255) NULL,
  distrito VARCHAR(100) NULL,
  provincia VARCHAR(100) NULL,
  departamento VARCHAR(100) NULL,
  area_terreno DECIMAL(12,2) NULL,
  area_construida DECIMAL(12,2) NULL,
  habitaciones INT NULL,
  banos INT NULL,
  caracteristicas TEXT NULL,
  observaciones TEXT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'activo',
  etapa VARCHAR(40) NOT NULL DEFAULT 'visita_pendiente',
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  fecha_salida DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inm_inmuebles_codigo (codigo),
  CONSTRAINT fk_inm_inmuebles_propietario
    FOREIGN KEY (propietario_id) REFERENCES inm_propietarios(id)
);

-- La posición 01–90 es reutilizable y NO es la identidad del inmueble.
CREATE TABLE inm_posiciones (
  id TINYINT UNSIGNED NOT NULL,
  numero TINYINT UNSIGNED NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inm_posiciones_numero (numero),
  CONSTRAINT chk_inm_posiciones_numero CHECK (numero BETWEEN 1 AND 90)
);

-- Un registro histórico por ocupación de una posición.
-- Permite reutilizar una posición sin perder su historial.
CREATE TABLE inm_asignaciones_posicion (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inmueble_id BIGINT UNSIGNED NOT NULL,
  posicion_id TINYINT UNSIGNED NOT NULL,
  fecha_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_fin DATETIME NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inm_posicion_activa (posicion_id, activa),
  CONSTRAINT fk_inm_asig_inmueble
    FOREIGN KEY (inmueble_id) REFERENCES inm_inmuebles(id),
  CONSTRAINT fk_inm_asig_posicion
    FOREIGN KEY (posicion_id) REFERENCES inm_posiciones(id)
);

CREATE TABLE inm_visitas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inmueble_id BIGINT UNSIGNED NOT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_visita DATE NULL,
  completada BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_completada DATETIME NULL,
  observaciones TEXT NULL,
  drive_link VARCHAR(1000) NULL,
  usuario_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_inm_visitas_inmueble
    FOREIGN KEY (inmueble_id) REFERENCES inm_inmuebles(id),
  CONSTRAINT fk_inm_visitas_usuario
    FOREIGN KEY (usuario_id) REFERENCES inm_usuarios(id)
);

-- Una sola tasación vigente por inmueble; una actualización reemplaza la anterior.
CREATE TABLE inm_tasaciones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inmueble_id BIGINT UNSIGNED NOT NULL,
  fecha_tasacion DATE NOT NULL,
  valor_referencia DECIMAL(15,2) NULL,
  precio_objetivo DECIMAL(15,2) NULL,
  situacion VARCHAR(30) NOT NULL DEFAULT 'pendiente_aprobacion',
  observacion TEXT NULL,
  usuario_id BIGINT UNSIGNED NOT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inm_tasaciones_inmueble (inmueble_id),
  CONSTRAINT fk_inm_tasaciones_inmueble
    FOREIGN KEY (inmueble_id) REFERENCES inm_inmuebles(id),
  CONSTRAINT fk_inm_tasaciones_usuario
    FOREIGN KEY (usuario_id) REFERENCES inm_usuarios(id)
);

CREATE TABLE inm_publicaciones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inmueble_id BIGINT UNSIGNED NOT NULL,
  texto TEXT NOT NULL,
  drive_link VARCHAR(1000) NOT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_registro_id BIGINT UNSIGNED NOT NULL,
  publicado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_publicacion DATETIME NULL,
  usuario_publicacion_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inm_publicaciones_inmueble (inmueble_id),
  CONSTRAINT fk_inm_publicaciones_inmueble
    FOREIGN KEY (inmueble_id) REFERENCES inm_inmuebles(id),
  CONSTRAINT fk_inm_publicaciones_registro
    FOREIGN KEY (usuario_registro_id) REFERENCES inm_usuarios(id),
  CONSTRAINT fk_inm_publicaciones_publicacion
    FOREIGN KEY (usuario_publicacion_id) REFERENCES inm_usuarios(id)
);

CREATE TABLE inm_liberaciones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inmueble_id BIGINT UNSIGNED NOT NULL,
  motivo VARCHAR(40) NOT NULL,
  detalle_otro VARCHAR(500) NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_registro_id BIGINT UNSIGNED NOT NULL,
  confirmado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_confirmacion DATETIME NULL,
  usuario_confirmacion_id BIGINT UNSIGNED NULL,
  anulada BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_anulacion DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inm_liberacion_pendiente (inmueble_id, confirmado, anulada),
  CONSTRAINT fk_inm_liberaciones_inmueble
    FOREIGN KEY (inmueble_id) REFERENCES inm_inmuebles(id),
  CONSTRAINT fk_inm_liberaciones_registro
    FOREIGN KEY (usuario_registro_id) REFERENCES inm_usuarios(id),
  CONSTRAINT fk_inm_liberaciones_confirmacion
    FOREIGN KEY (usuario_confirmacion_id) REFERENCES inm_usuarios(id)
);

CREATE TABLE inm_archivos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inmueble_id BIGINT UNSIGNED NOT NULL,
  tipo_documento VARCHAR(80) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  enlace VARCHAR(1000) NOT NULL,
  observacion VARCHAR(500) NULL,
  usuario_id BIGINT UNSIGNED NOT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_inm_archivos_inmueble
    FOREIGN KEY (inmueble_id) REFERENCES inm_inmuebles(id),
  CONSTRAINT fk_inm_archivos_usuario
    FOREIGN KEY (usuario_id) REFERENCES inm_usuarios(id)
);

-- Línea de tiempo de hitos importantes. No es auditoría campo-por-campo.
CREATE TABLE inm_timeline (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  inmueble_id BIGINT UNSIGNED NOT NULL,
  evento VARCHAR(60) NOT NULL,
  observacion TEXT NULL,
  usuario_id BIGINT UNSIGNED NOT NULL,
  fecha_evento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_inm_timeline_inmueble
    FOREIGN KEY (inmueble_id) REFERENCES inm_inmuebles(id),
  CONSTRAINT fk_inm_timeline_usuario
    FOREIGN KEY (usuario_id) REFERENCES inm_usuarios(id)
);

-- Catálogos iniciales de posiciones. Ejecutar solo en la BD de Inmobiliaria.
INSERT INTO inm_posiciones (id, numero)
SELECT n, n
FROM (
  SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
  UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
  UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
  UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
  UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25
  UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
  UNION ALL SELECT 31 UNION ALL SELECT 32 UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL SELECT 35
  UNION ALL SELECT 36 UNION ALL SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39 UNION ALL SELECT 40
  UNION ALL SELECT 41 UNION ALL SELECT 42 UNION ALL SELECT 43 UNION ALL SELECT 44 UNION ALL SELECT 45
  UNION ALL SELECT 46 UNION ALL SELECT 47 UNION ALL SELECT 48 UNION ALL SELECT 49 UNION ALL SELECT 50
  UNION ALL SELECT 51 UNION ALL SELECT 52 UNION ALL SELECT 53 UNION ALL SELECT 54 UNION ALL SELECT 55
  UNION ALL SELECT 56 UNION ALL SELECT 57 UNION ALL SELECT 58 UNION ALL SELECT 59 UNION ALL SELECT 60
  UNION ALL SELECT 61 UNION ALL SELECT 62 UNION ALL SELECT 63 UNION ALL SELECT 64 UNION ALL SELECT 65
  UNION ALL SELECT 66 UNION ALL SELECT 67 UNION ALL SELECT 68 UNION ALL SELECT 69 UNION ALL SELECT 70
  UNION ALL SELECT 71 UNION ALL SELECT 72 UNION ALL SELECT 73 UNION ALL SELECT 74 UNION ALL SELECT 75
  UNION ALL SELECT 76 UNION ALL SELECT 77 UNION ALL SELECT 78 UNION ALL SELECT 79 UNION ALL SELECT 80
  UNION ALL SELECT 81 UNION ALL SELECT 82 UNION ALL SELECT 83 UNION ALL SELECT 84 UNION ALL SELECT 85
  UNION ALL SELECT 86 UNION ALL SELECT 87 UNION ALL SELECT 88 UNION ALL SELECT 89 UNION ALL SELECT 90
) posiciones
ON DUPLICATE KEY UPDATE numero = VALUES(numero);
