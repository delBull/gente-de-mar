import { Client } from "pg";

async function checkBusinessesTable() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ Error: No se encontró DATABASE_URL en las variables de entorno.");
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("🔗 Conectado a la base de datos.");

    const res = await client.query(`
      SELECT to_regclass('public.businesses') AS exists;
    `);

    if (res.rows[0].exists) {
      console.log("✅ La tabla 'businesses' existe en la base de datos.");
    } else {
      console.warn("⚠️ La tabla 'businesses' NO existe en la base de datos.");
    }
  } catch (error) {
    console.error("❌ Error al consultar la base de datos:", error);
  } finally {
    await client.end();
  }
}

checkBusinessesTable();