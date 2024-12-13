const jwt = require("jsonwebtoken");
const db = require("../models"); // Cambiamos la importación

const protect = async (req, res, next) => {
    try {
        console.log("Headers:", req.headers);

        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
            console.log("Token extraído:", token);
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No autorizado para acceder a esta ruta",
            });
        }

        try {
            console.log("JWT_SECRET:", process.env.JWT_SECRET);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Token decodificado:", decoded);

            // Usamos db.User en lugar de User directamente
            const user = await db.User.findByPk(decoded.id);
            console.log("Usuario encontrado:", user ? "Sí" : "No");

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no encontrado",
                });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error("Error específico en verificación:", error);
            return res.status(401).json({
                success: false,
                message: "Token no válido o expirado",
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
            });
        }
    } catch (error) {
        console.error("Error general en middleware:", error);
        return res.status(500).json({
            success: false,
            message: "Error en autenticación",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para realizar esta acción",
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
