const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const db = require("./models");
const authRoutes = require("./routes/auth.routes");
const courseRoutes = require("./routes/course.routes");
const lessonRoutes = require("./routes/lesson.routes");
const progressRoutes = require("./routes/progress.routes");
const assessmentRoutes = require("./routes/assessment.routes");
const reviewRoutes = require("./routes/review.routes");
const notificationRoutes = require("./routes/notification.routes");
const categoryRoutes = require("./routes/category.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const userRoutes = require("./routes/user.routes");

const app = express();

// Middleware para logging detallado
app.use(morgan("dev"));

// Middleware para parsear JSON
app.use(express.json());

// Configuración de CORS
const allowedOrigins = [
    "http://localhost:3000", // Para desarrollo local
    "http://localhost:5173", // Para desarrollo con Vite
    "https://quantum-quest-front-end.vercel.app", // Dominio principal de producción
    "https://quantum-quest-front-end-git-develop-katogcs-projects.vercel.app", // Subdominio para pruebas
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir solicitudes de orígenes permitidos
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS bloqueado: origen no permitido"));
        }
    },
    credentials: true, // Permitir cookies y encabezados de autorización
}));

// Middleware personalizado para logging del body
app.use((req, res, next) => {
    if (req.body) {
        console.log("Request Body:", req.body);
    }
    next();
});

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes); // Rutas principales de los cursos
app.use("/api/courses/:courseId/lessons", lessonRoutes); // Rutas anidadas para lecciones
app.use("/api/progress", progressRoutes);
app.use("/api/lessons/:lessonId/assessments", assessmentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Ruta de prueba
app.get("/test", (req, res) => {
    res.json({ message: "API funcionando correctamente" });
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    if (err.message === "CORS bloqueado: origen no permitido") {
        return res.status(403).json({ message: err.message });
    }
    res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Intentar autenticar la conexión a la base de datos
        await db.sequelize.authenticate();
        console.log("Conexión a la base de datos establecida correctamente");

        // Sincronizar modelos
        await db.sequelize.sync({ alter: true });
        console.log("Modelos sincronizados correctamente");

        // Iniciar el servidor
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error("Error al iniciar el servidor:", error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
