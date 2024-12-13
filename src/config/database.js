const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    dialectOptions: {
        charset: "utf8",
        collate: "utf8_general_ci",
        useUTC: false,
        timezone: "-06:00", // Ajusta esto a tu zona horaria
    },
    define: {
        charset: "utf8",
        collate: "utf8_general_ci",
        timestamps: true,
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});

// Función para probar la conexión
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log("Conexión a la base de datos establecida correctamente.");

        // Sincronizar modelos con la base de datos
        await sequelize.sync({ alter: true });
        console.log("Modelos sincronizados correctamente.");
    } catch (error) {
        console.error("No se pudo conectar a la base de datos:", error);
    }
};

// Ejecutar el test de conexión
testConnection();

module.exports = sequelize;
