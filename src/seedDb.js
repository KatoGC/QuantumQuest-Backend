const db = require("./models");
const createCategories = require("./seeders/CategorySeeder");

const seedDatabase = async () => {
    try {
        // Asegurarse de que la conexión está establecida
        await db.sequelize.authenticate();
        console.log("Conexión establecida correctamente.");

        // Ejecutar los seeders
        await createCategories();

        console.log("Base de datos poblada exitosamente");
        process.exit(0);
    } catch (error) {
        console.error("Error al poblar la base de datos:", error);
        process.exit(1);
    }
};

seedDatabase();
