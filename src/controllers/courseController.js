const db = require("../models");
const { createNotification } = require("./notificationController");
const slugify = require("slugify"); // Necesitarás instalar este paquete

const getAllCourses = async (req, res) => {
    try {
        const { categoryId, level, search, creatorId } = req.query;
        const where = {};

        if (categoryId) where.categoryId = categoryId;
        if (level) where.level = level;
        if (creatorId) where.creatorId = creatorId;
        if (search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const courses = await db.Course.findAll({
            where,
            include: [
                {
                    model: db.User,
                    as: "creator",
                    attributes: ["id", "name"],
                },
                {
                    model: db.Category,
                    attributes: ["id", "name", "level", "grade"],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        res.json({
            success: true,
            data: courses,
        });
    } catch (error) {
        console.error("Error al obtener cursos:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener los cursos",
        });
    }
};

const createCourse = async (req, res) => {
    try {
        const course = await db.Course.create({
            ...req.body,
            creatorId: req.user.id,
        });

        // Crear notificación con el tipo correcto
        await db.Notification.create({
            userId: req.user.id,
            title: "Curso creado",
            message: `Has creado el curso "${course.title}" exitosamente`,
            type: "course",
            relatedId: course.id,
            relatedType: "Course",
        });

        res.status(201).json({
            success: true,
            data: course,
        });
    } catch (error) {
        console.error("Error al crear curso:", error);
        res.status(500).json({
            success: false,
            message: "Error al crear el curso",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Obtener un curso específico
const getCourse = async (req, res) => {
    try {
        console.log("Fetching course ID:", req.params.id);
        const course = await db.Course.findByPk(req.params.id, {
            include: [
                {
                    model: db.User,
                    as: "creator",
                    attributes: ["id", "name"],
                },
                {
                    model: db.Category,
                    attributes: ["id", "name", "level", "grade"],
                },
                {
                    model: db.Lesson,
                    order: [["orderIndex", "ASC"]],
                },
            ],
        });
        console.log("Course found:", course);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Curso no encontrado",
            });
        }

        const enrolledStudents = await db.Progress.count({
            where: { courseId: course.id },
        });

        const completedStudents = await db.Progress.count({
            where: {
                courseId: course.id,
                progressPercentage: 100,
            },
        });

        res.json({
            success: true,
            data: {
                ...course.toJSON(),
                stats: {
                    enrolledStudents,
                    completedStudents,
                    completionRate: enrolledStudents
                        ? (completedStudents / enrolledStudents) * 100
                        : 0,
                },
            },
        });
    } catch (error) {
        console.error("Error detallado:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener el curso",
            error: error.message,
        });
    }
};

// Actualizar un curso
const updateCourse = async (req, res) => {
    try {
        const course = await db.Course.findByPk(req.params.id);

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
                message: "No tienes permiso para modificar este curso",
            });
        }

        // Actualizar el curso
        const updatedCourse = await course.update(req.body);

        res.json({
            success: true,
            data: updatedCourse,
        });
    } catch (error) {
        console.error("Error al actualizar curso:", error);
        res.status(500).json({
            success: false,
            message: "Error al actualizar el curso",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Eliminar un curso
const deleteCourse = async (req, res) => {
    try {
        const course = await db.Course.findByPk(req.params.id);

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
                message: "No tienes permiso para eliminar este curso",
            });
        }

        await course.destroy();

        res.json({
            success: true,
            message: "Curso eliminado exitosamente",
        });
    } catch (error) {
        console.error("Error al eliminar curso:", error);
        res.status(500).json({
            success: false,
            message: "Error al eliminar el curso",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Inscribirse a un curso
const enrollCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;

        const course = await db.Course.findByPk(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Curso no encontrado"
            });
        }

        const [progress, created] = await db.Progress.findOrCreate({
            where: {
                userId,
                courseId,
                lessonId: null,
                isCourseLevelProgress: true
            },
            defaults: {
                progressPercentage: 0,
                timeSpent: 0
            }
        });

        if (!created) {
            return res.status(400).json({
                success: false,
                message: "Ya estás inscrito en este curso"
            });
        }

        res.json({
            success: true,
            message: "Inscripción exitosa"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollCourse,
};
