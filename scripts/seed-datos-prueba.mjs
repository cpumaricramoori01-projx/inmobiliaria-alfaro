import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Falta configurar DATABASE_URL en las variables de entorno.");
  process.exit(1);
}

const propietarios = [
  ["90000001","Juan Carlos","Mendoza Ruiz"],["90000002","María Elena","Torres Salazar"],
  ["90000003","Luis Alberto","Vásquez Rojas"],["90000004","Carmen Rosa","Delgado Pérez"],
  ["90000005","Roberto Antonio","Flores Díaz"],["90000006","Patricia Milagros","Sánchez León"],
  ["90000007","Miguel Ángel","Castro Núñez"],["90000008","Ana Lucía","Mendoza Campos"],
  ["90000009","Jorge Eduardo","Salinas Vega"],["90000010","Rosa Isabel","Ramírez Soto"],
  ["90000011","Diego Martín","Herrera Cruz"],["90000012","Silvia Beatriz","Paredes Luna"],
  ["90000013","Carlos Alberto","Rojas Medina"],["90000014","Elena Margarita","Campos Ruiz"],
  ["90000015","Fernando José","Castillo Peña"],["90000016","Gabriela Patricia","Moreno Díaz"],
  ["90000017","Víctor Manuel","Espinoza Torres"],["90000018","Andrea Sofía","Navarro León"],
  ["90000019","Manuel Antonio","Ponce Vargas"],["90000020","Beatriz Elena","Gutiérrez Soto"],
  ["90000021","Ricardo Javier","Mendoza Flores"],["90000022","Claudia Isabel","Vargas Ríos"],
  ["90000023","Héctor Daniel","Salazar Cruz"],["90000024","Mónica Teresa","Herrera Díaz"],
  ["90000025","Óscar Enrique","León Castillo"],["90000026","Verónica Lucía","Torres Medina"],
  ["90000027","José Miguel","Rivas Paredes"],["90000028","Adriana Beatriz","Flores Campos"],
  ["90000029","Sergio Alberto","Núñez Morales"],["90000030","Lorena Patricia","Díaz Vargas"]
];

const inmuebles = [
  [1,"Casa","Casa Los Pinos"],[2,"Departamento","Dpto. Vista al Mar"],[3,"Terreno","Terreno Bellamar"],
  [4,"Casa","Casa Santa Rosa"],[5,"Local","Local Comercial Central"],[6,"Departamento","Dpto. Los Portales"],
  [7,"Oficina","Oficina Pacífico"],[8,"Casa","Casa Villa Marina"],[9,"Terreno","Terreno Las Palmeras"],
  [10,"Casa","Casa San Pedro"],[11,"Local","Local Buenos Aires"],[12,"Departamento","Dpto. Residencial Pacífico"],
  [13,"Casa","Casa Los Álamos"],[14,"Terreno","Terreno Nuevo Horizonte"],[15,"Departamento","Dpto. Las Brisas"],
  [16,"Casa","Casa Los Cedros"],[17,"Local","Local Comercial Norte"],[18,"Oficina","Oficina Costa Azul"],
  [19,"Terreno","Terreno El Mirador"],[20,"Casa","Casa Las Flores"],[21,"Departamento","Dpto. Los Jardines"],
  [22,"Casa","Casa El Bosque"],[23,"Terreno","Terreno Los Sauces"],[24,"Local","Local Comercial Sur"],
  [25,"Departamento","Dpto. Vista Norte"],[26,"Casa","Casa Las Palmeras"],[27,"Oficina","Oficina Empresarial Norte"],
  [28,"Terreno","Terreno Villa Sol"],[29,"Casa","Casa Los Girasoles"],[30,"Departamento","Dpto. Costa del Sol"]
];

const connection = await mysql.createConnection(DATABASE_URL);

try {
  await connection.beginTransaction();

  const [userRows] = await connection.execute(
    "SELECT id FROM inm_usuarios WHERE email = ? LIMIT 1",
    ["sistema@inmobiliaria-alfaro.local"]
  );

  let usuarioId = userRows[0]?.id;
  if (!usuarioId) {
    const [result] = await connection.execute(
      "INSERT INTO inm_usuarios (nombre, email, rol, activo) VALUES (?, ?, ?, 1)",
      ["Usuario actual", "sistema@inmobiliaria-alfaro.local", "usuario"]
    );
    usuarioId = result.insertId;
  }

  for (let i = 0; i < propietarios.length; i++) {
    const [dni, nombres, apellidos] = propietarios[i];
    const [existing] = await connection.execute(
      "SELECT id FROM inm_propietarios WHERE dni = ? LIMIT 1",
      [dni]
    );

    let propietarioId = existing[0]?.id;
    if (!propietarioId) {
      const [result] = await connection.execute(
        "INSERT INTO inm_propietarios (dni, nombres, apellidos) VALUES (?, ?, ?)",
        [dni, nombres, apellidos]
      );
      propietarioId = result.insertId;
    }

    const [position, tipo, referencia] = inmuebles[i];
    const [occupied] = await connection.execute(
      "SELECT id FROM inm_asignaciones_posicion WHERE posicion_id = ? AND activa = 1 LIMIT 1",
      [position]
    );

    if (occupied[0]) {
      console.log(`Omitida posición ${String(position).padStart(2, "0")}: ya está ocupada.`);
      continue;
    }

    const code = `PRUEBA-${String(position).padStart(2, "0")}`;
    const [existingProperty] = await connection.execute(
      "SELECT id FROM inm_inmuebles WHERE codigo = ? LIMIT 1",
      [code]
    );

    if (existingProperty[0]) {
      console.log(`Omitido ${code}: ya existe.`);
      continue;
    }

    const [propertyResult] = await connection.execute(
      `INSERT INTO inm_inmuebles
        (codigo, propietario_id, tipo, referencia, estado, etapa)
       VALUES (?, ?, ?, ?, 'activo', 'visita_pendiente')`,
      [code, propietarioId, tipo, referencia]
    );

    const inmuebleId = propertyResult.insertId;

    await connection.execute(
      "INSERT INTO inm_asignaciones_posicion (inmueble_id, posicion_id, activa) VALUES (?, ?, 1)",
      [inmuebleId, position]
    );

    await connection.execute(
      `INSERT INTO inm_timeline
        (inmueble_id, evento, observacion, usuario_id)
       VALUES (?, 'inmueble_registrado', ?, ?)`,
      [inmuebleId, "Registro ficticio creado para pruebas del sistema.", usuarioId]
    );

    console.log(`✓ ${code} → posición ${String(position).padStart(2, "0")}`);
  }

  await connection.commit();
  console.log("\nSeed de datos ficticios completado.");
  console.log("Se prepararon hasta 30 inmuebles de prueba en posiciones 01–30.");
} catch (error) {
  await connection.rollback();
  console.error("Error al cargar los datos ficticios:", error.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}