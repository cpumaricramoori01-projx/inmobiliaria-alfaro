CREATE TABLE `inm_archivos` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`inmueble_id` bigint unsigned NOT NULL,
	`tipo_documento` varchar(80) NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`enlace` varchar(1000) NOT NULL,
	`observacion` varchar(500),
	`usuario_id` bigint unsigned NOT NULL,
	`fecha_registro` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inm_archivos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inm_asignaciones_posicion` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`inmueble_id` bigint unsigned NOT NULL,
	`posicion_id` tinyint unsigned NOT NULL,
	`fecha_inicio` timestamp NOT NULL DEFAULT (now()),
	`fecha_fin` timestamp,
	`activa` boolean NOT NULL DEFAULT true,
	CONSTRAINT `inm_asignaciones_posicion_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inm_config_alertas` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tipo` varchar(50) NOT NULL,
	`dias` int NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`descripcion` varchar(255),
	`fecha_actualizacion` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`usuario_actualizacion_id` bigint unsigned,
	CONSTRAINT `inm_config_alertas_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_inm_config_alertas_tipo` UNIQUE(`tipo`)
);
--> statement-breakpoint
CREATE TABLE `inm_inmuebles` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`codigo` varchar(30) NOT NULL,
	`propietario_id` bigint unsigned NOT NULL,
	`tipo` varchar(30) NOT NULL,
	`referencia` varchar(255) NOT NULL,
	`direccion` varchar(255),
	`distrito` varchar(100),
	`provincia` varchar(100),
	`departamento` varchar(100),
	`area_terreno` decimal(12,2),
	`area_construida` decimal(12,2),
	`habitaciones` int,
	`banos` int,
	`caracteristicas` text,
	`observaciones` text,
	`estado` varchar(30) NOT NULL DEFAULT 'activo',
	`etapa` varchar(40) NOT NULL DEFAULT 'visita_pendiente',
	`fecha_registro` timestamp NOT NULL DEFAULT (now()),
	`fecha_actualizacion` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`fecha_salida` timestamp,
	CONSTRAINT `inm_inmuebles_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_inm_inmuebles_codigo` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `inm_liberaciones` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`inmueble_id` bigint unsigned NOT NULL,
	`motivo` varchar(40) NOT NULL,
	`detalle_otro` varchar(500),
	`fecha_registro` timestamp NOT NULL DEFAULT (now()),
	`usuario_registro_id` bigint unsigned NOT NULL,
	`confirmado` boolean NOT NULL DEFAULT false,
	`fecha_confirmacion` timestamp,
	`usuario_confirmacion_id` bigint unsigned,
	`anulada` boolean NOT NULL DEFAULT false,
	`fecha_anulacion` timestamp,
	CONSTRAINT `inm_liberaciones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inm_posiciones` (
	`id` tinyint unsigned NOT NULL,
	`numero` tinyint unsigned NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	CONSTRAINT `inm_posiciones_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_inm_posiciones_numero` UNIQUE(`numero`)
);
--> statement-breakpoint
CREATE TABLE `inm_propietarios` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`dni` varchar(20) NOT NULL,
	`nombres` varchar(120) NOT NULL,
	`apellidos` varchar(160) NOT NULL,
	`telefono` varchar(40),
	`email` varchar(160),
	`referencia_contacto` varchar(255),
	`fecha_registro` timestamp NOT NULL DEFAULT (now()),
	`fecha_actualizacion` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inm_propietarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_inm_propietarios_dni` UNIQUE(`dni`)
);
--> statement-breakpoint
CREATE TABLE `inm_publicaciones` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`inmueble_id` bigint unsigned NOT NULL,
	`texto` text NOT NULL,
	`drive_link` varchar(1000) NOT NULL,
	`fecha_registro` timestamp NOT NULL DEFAULT (now()),
	`usuario_registro_id` bigint unsigned NOT NULL,
	`publicado` boolean NOT NULL DEFAULT false,
	`fecha_publicacion` timestamp,
	`usuario_publicacion_id` bigint unsigned,
	CONSTRAINT `inm_publicaciones_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_inm_publicaciones_inmueble` UNIQUE(`inmueble_id`)
);
--> statement-breakpoint
CREATE TABLE `inm_tasaciones` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`inmueble_id` bigint unsigned NOT NULL,
	`fecha_tasacion` date NOT NULL,
	`valor_referencia` decimal(15,2),
	`precio_objetivo` decimal(15,2),
	`situacion` varchar(30) NOT NULL DEFAULT 'pendiente_aprobacion',
	`observacion` text,
	`usuario_id` bigint unsigned NOT NULL,
	`fecha_registro` timestamp NOT NULL DEFAULT (now()),
	`fecha_actualizacion` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inm_tasaciones_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_inm_tasaciones_inmueble` UNIQUE(`inmueble_id`)
);
--> statement-breakpoint
CREATE TABLE `inm_timeline` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`inmueble_id` bigint unsigned NOT NULL,
	`evento` varchar(60) NOT NULL,
	`observacion` text,
	`usuario_id` bigint unsigned NOT NULL,
	`fecha_evento` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inm_timeline_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inm_usuarios` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`nombre` varchar(120) NOT NULL,
	`email` varchar(160) NOT NULL,
	`rol` varchar(30) NOT NULL DEFAULT 'usuario',
	`activo` boolean NOT NULL DEFAULT true,
	`fecha_registro` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inm_usuarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_inm_usuarios_email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `inm_visitas` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`inmueble_id` bigint unsigned NOT NULL,
	`fecha_registro` timestamp NOT NULL DEFAULT (now()),
	`fecha_visita` date,
	`completada` boolean NOT NULL DEFAULT false,
	`fecha_completada` timestamp,
	`observaciones` text,
	`drive_link` varchar(1000),
	`usuario_id` bigint unsigned NOT NULL,
	CONSTRAINT `inm_visitas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `inm_archivos` ADD CONSTRAINT `inm_archivos_inmueble_id_inm_inmuebles_id_fk` FOREIGN KEY (`inmueble_id`) REFERENCES `inm_inmuebles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_archivos` ADD CONSTRAINT `inm_archivos_usuario_id_inm_usuarios_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `inm_usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_asignaciones_posicion` ADD CONSTRAINT `inm_asignaciones_posicion_inmueble_id_inm_inmuebles_id_fk` FOREIGN KEY (`inmueble_id`) REFERENCES `inm_inmuebles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_asignaciones_posicion` ADD CONSTRAINT `inm_asignaciones_posicion_posicion_id_inm_posiciones_id_fk` FOREIGN KEY (`posicion_id`) REFERENCES `inm_posiciones`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_config_alertas` ADD CONSTRAINT `inm_config_alertas_usuario_actualizacion_id_inm_usuarios_id_fk` FOREIGN KEY (`usuario_actualizacion_id`) REFERENCES `inm_usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_inmuebles` ADD CONSTRAINT `inm_inmuebles_propietario_id_inm_propietarios_id_fk` FOREIGN KEY (`propietario_id`) REFERENCES `inm_propietarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_liberaciones` ADD CONSTRAINT `inm_liberaciones_inmueble_id_inm_inmuebles_id_fk` FOREIGN KEY (`inmueble_id`) REFERENCES `inm_inmuebles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_liberaciones` ADD CONSTRAINT `inm_liberaciones_usuario_registro_id_inm_usuarios_id_fk` FOREIGN KEY (`usuario_registro_id`) REFERENCES `inm_usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_liberaciones` ADD CONSTRAINT `inm_liberaciones_usuario_confirmacion_id_inm_usuarios_id_fk` FOREIGN KEY (`usuario_confirmacion_id`) REFERENCES `inm_usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_publicaciones` ADD CONSTRAINT `inm_publicaciones_inmueble_id_inm_inmuebles_id_fk` FOREIGN KEY (`inmueble_id`) REFERENCES `inm_inmuebles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_publicaciones` ADD CONSTRAINT `inm_publicaciones_usuario_registro_id_inm_usuarios_id_fk` FOREIGN KEY (`usuario_registro_id`) REFERENCES `inm_usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_publicaciones` ADD CONSTRAINT `inm_publicaciones_usuario_publicacion_id_inm_usuarios_id_fk` FOREIGN KEY (`usuario_publicacion_id`) REFERENCES `inm_usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_tasaciones` ADD CONSTRAINT `inm_tasaciones_inmueble_id_inm_inmuebles_id_fk` FOREIGN KEY (`inmueble_id`) REFERENCES `inm_inmuebles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_tasaciones` ADD CONSTRAINT `inm_tasaciones_usuario_id_inm_usuarios_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `inm_usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_timeline` ADD CONSTRAINT `inm_timeline_inmueble_id_inm_inmuebles_id_fk` FOREIGN KEY (`inmueble_id`) REFERENCES `inm_inmuebles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_timeline` ADD CONSTRAINT `inm_timeline_usuario_id_inm_usuarios_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `inm_usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_visitas` ADD CONSTRAINT `inm_visitas_inmueble_id_inm_inmuebles_id_fk` FOREIGN KEY (`inmueble_id`) REFERENCES `inm_inmuebles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inm_visitas` ADD CONSTRAINT `inm_visitas_usuario_id_inm_usuarios_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `inm_usuarios`(`id`) ON DELETE no action ON UPDATE no action;