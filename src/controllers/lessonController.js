const db = require("../models");

// Obtener todas las lecciones de un curso
const getLessons = async (req, res) => {
    try {
        const lessons = await db.Lesson.findAll({
            where: { courseId: req.params.courseId },
            order: [["orderIndex", "ASC"]],
            attributes: ['id', 'title', 'content', 'duration', 'videoUrl', 'orderIndex'],
            group: ['id'], // Elimina duplicados
        });

        res.json({
            success: true,
            data: lessons,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener las lecciones"
        });
    }
};

// Obtener una lección específica
const getLesson = async (req, res) => {
    try {
        const lesson = await db.Lesson.findOne({
            where: {
                id: req.params.id,
                courseId: req.params.courseId,
            },
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lección no encontrada",
            });
        }

        res.json({
            success: true,
            data: lesson,
        });
    } catch (error) {
        console.error("Error al obtener lección:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener la lección",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Crear una nueva lección
const createLesson = async (req, res) => {
    try {
        const course = await db.Course.findByPk(req.params.courseId);
        console.log("Parámetros de ruta:", req.params);
        console.log("Datos recibidos:", req.body);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Curso no encontrado",
            });
        }

        // Verificar que el usuario es el creador del curso
        if (course.creatorId !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para añadir lecciones a este curso",
            });
        }

        const { title, content, orderIndex, duration, videoUrl } = req.body;

        const lesson = await db.Lesson.create({
            title,
            content,
            orderIndex,
            duration,
            videoUrl,
            courseId: req.params.courseId,
        });

        res.status(201).json({
            success: true,
            data: lesson,
        });
    } catch (error) {
        console.error("Error al crear lección:", error);
        res.status(500).json({
            success: false,
            message: "Error al crear la lección",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Actualizar una lección
const updateLesson = async (req, res) => {
    try {
        const lesson = await db.Lesson.findOne({
            where: {
                id: req.params.id,
                courseId: req.params.courseId,
            },
            include: [
                {
                    model: db.Course,
                    attributes: ["creatorId"],
                },
            ],
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lección no encontrada",
            });
        }

        // Verificar permisos
        if (
            lesson.Course.creatorId !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para modificar esta lección",
            });
        }

        const updatedLesson = await lesson.update(req.body);

        res.json({
            success: true,
            data: updatedLesson,
        });
    } catch (error) {
        console.error("Error al actualizar lección:", error);
        res.status(500).json({
            success: false,
            message: "Error al actualizar la lección",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

const completeLesson = async (req, res) => {
    try {
        const { courseId, id: lessonId } = req.params;
        const userId = req.user.id;

        const lesson = await db.Lesson.findOne({
            where: { id: lessonId, courseId },
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lección no encontrada",
            });
        }

        const [progress, created] = await db.Progress.findOrCreate({
            where: {
                userId,
                courseId: lesson.courseId,
                lessonId
            },
            defaults: {
                completed: true,
                progressPercentage: 100
            }
        });

        if (!created) {
            await progress.update({ completed: true });
        }

        // Actualizar progreso general del curso
        const totalLessons = await db.Lesson.count({
            where: { courseId: lesson.courseId }
        });

        const completedLessons = await db.Progress.count({
            where: {
                userId,
                courseId: lesson.courseId,
                completed: true
            }
        });

        const courseProgress = Math.round((completedLessons / totalLessons) * 100);

        await db.Progress.update(
            { progressPercentage: courseProgress },
            {
                where: {
                    userId,
                    courseId: lesson.courseId,
                    lessonId: null
                }
            }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Eliminar una lección
const deleteLesson = async (req, res) => {
    try {
        const lesson = await db.Lesson.findOne({
            where: {
                id: req.params.id,
                courseId: req.params.courseId,
            },
            include: [
                {
                    model: db.Course,
                    attributes: ["creatorId"],
                },
            ],
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lección no encontrada",
            });
        }

        // Verificar permisos
        if (
            lesson.Course.creatorId !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para eliminar esta lección",
            });
        }

        await lesson.destroy();

        res.json({
            success: true,
            message: "Lección eliminada exitosamente",
        });
    } catch (error) {
        console.error("Error al eliminar lección:", error);
        res.status(500).json({
            success: false,
            message: "Error al eliminar la lección",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

module.exports = {
    getLessons,
    getLesson,
    createLesson,
    completeLesson,
    updateLesson,
    deleteLesson,
};
