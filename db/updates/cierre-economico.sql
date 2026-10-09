-- En bases existentes utilizar scripts/install-business-workflow.mjs (idempotente).
ALTER TABLE inm_liberaciones
  ADD COLUMN fecha_venta DATE NULL,
  ADD COLUMN precio_final DECIMAL(15,2) NULL,
  ADD COLUMN comision DECIMAL(15,2) NULL,
  ADD COLUMN datos_simulados BOOLEAN NOT NULL DEFAULT FALSE;
