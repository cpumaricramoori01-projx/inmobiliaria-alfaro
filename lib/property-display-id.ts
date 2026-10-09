type PropertyIdentity = {
  posicion?: number | string | null;
  tipo?: string | null;
  nombre?: string | null;
  referencia?: string | null;
  propietario?: string | null;
  propietarioNombres?: string | null;
  propietarioApellidos?: string | null;
};

export function propertyDisplayId(property: PropertyIdentity): string {
  const owner = [property.propietarioNombres, property.propietarioApellidos].filter(Boolean).join(" ")
    || (property.propietario && !["Sin propietario", "Por completar"].includes(property.propietario) ? property.propietario : "")
    || property.nombre || property.referencia || "Por completar";
  return [property.posicion == null || property.posicion === "" ? "SIN POSICIÓN" : String(property.posicion).padStart(2, "0"), property.tipo || "Otros", owner]
    .map(value => value.trim().replace(/\s+/g, " ").toLocaleUpperCase("es-PE")).join("-");
}
