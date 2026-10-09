ALTER TABLE `inm_inmuebles` ADD `operacion` varchar(10) DEFAULT 'venta' NOT NULL;

ALTER TABLE `inm_liberaciones` ADD `fecha_alquiler` date;

ALTER TABLE `inm_liberaciones` ADD `renta_mensual` decimal(15,2);

ALTER TABLE `inm_liberaciones` ADD `garantia` decimal(15,2);

ALTER TABLE `inm_liberaciones` ADD `adelanto` decimal(15,2);

ALTER TABLE `inm_liberaciones` ADD `fecha_inicio_alquiler` date;

ALTER TABLE `inm_liberaciones` ADD `fecha_fin_alquiler` date;