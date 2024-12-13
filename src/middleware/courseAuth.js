const db = require("../models");

const checkCourseOwnership = async (req, res, next) => {
    try {
        const course = await db.Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Curso no encontrado",
            });
        }

        if (course.creatorId !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para modificar este curso",
            });
        }

        req.course = course;
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al verificar permisos",
        });
    }
};

module.exports = { checkCourseOwnership };
