-- Ejecutar una vez, o usar scripts/install-locations.mjs (idempotente).
ALTER TABLE inm_inmuebles
  ADD COLUMN latitud DECIMAL(10,7) NULL,
  ADD COLUMN longitud DECIMAL(10,7) NULL;
