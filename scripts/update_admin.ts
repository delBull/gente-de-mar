import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateAdmin() {
    console.log("Updating admin user...");
    try {
        // Buscar usuarios existentes para ver qué hay
        const existingUsers = await db.select().from(users);
        console.log("Existing users:", existingUsers.map(u => ({ id: u.id, username: u.username, email: u.email })));

        // Actualizar usuario delbull (buscando por username o id)
        // El ID 1 suele ser el admin por defecto
        await db.update(users)
            .set({
                password: "bookeros2026",
                username: "Delbull", // Asegurar capitalización correcta
                email: "delbull@bookeros.com" // Asegurar email correcto
            })
            .where(eq(users.id, 1));

        console.log("✅ Admin user (ID 1) updated successfully to Delbull / bookeros2026");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error updating admin:", error);
        process.exit(1);
    }
}

updateAdmin();
