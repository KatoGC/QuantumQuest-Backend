const db = require("../models");
const { Op } = require("sequelize");

// Obtener progreso detallado del curso
const getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const course = await db.Course.findByPk(courseId, {
            include: [
                {
                    model: db.Lesson,
                    attributes: ["id"],
                },
            ],
        });

        const completedLessons = await db.LessonProgress.count({
            where: {
                userId,
                lessonId: course.Lessons.map((l) => l.id),
                completed: true,
            },
        });

        const totalLessons = course.Lessons.length;
        const progressPercentage = totalLessons
            ? (completedLessons / totalLessons) * 100
            : 0;

        res.json({
            success: true,
            data: {
                completedLessons,
                totalLessons,
                progressPercentage,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener progreso del curso",
        });
    }
};

// Obtener estadísticas generales del estudiante
const getStudentStats = async (req, res) => {
    try {
        const enrolledCourses = await db.Progress.findAll({
            where: {
                userId: req.user.id,
                isCourseLevelProgress: true
            },
            include: [{
                model: db.Course,
                attributes: ['title', 'level']
            }]
        });

        // Estadísticas generales
        const stats = {
            totalCourses: enrolledCourses.length,
            completedCourses: enrolledCourses.filter((c) => c.completed).length,
            inProgressCourses: enrolledCourses.filter((c) => !c.completed)
                .length,
            averageProgress: Math.round(
                enrolledCourses.reduce(
                    (sum, c) => sum + c.progressPercentage,
                    0
                ) / (enrolledCourses.length || 1)
            ),
            coursesByLevel: {
                beginner: 0,
                intermediate: 0,
                advanced: 0,
            },
            recentActivity: [],
        };

        // Contar cursos por nivel
        enrolledCourses.forEach((course) => {
            if (course.Course.level) {
                stats.coursesByLevel[course.Course.level]++;
            }
        });

        // Obtener actividad reciente
        const recentProgress = await db.Progress.findAll({
            where: {
                userId: req.user.id,
                lastAccessedAt: {
                    [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
                },
            },
            include: [
                {
                    model: db.Course,
                    attributes: ["title"],
                },
                {
                    model: db.Lesson,
                    attributes: ["title"],
                },
            ],
            order: [["lastAccessedAt", "DESC"]],
            limit: 10,
        });

        stats.recentActivity = recentProgress.map((progress) => ({
            date: progress.lastAccessedAt,
            courseTitle: progress.Course.title,
            lessonTitle: progress.Lesson?.title,
            activityType: progress.completed ? "completed" : "in_progress",
            progressPercentage: progress.progressPercentage,
        }));

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener las estadísticas",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Actualizar progreso de lección con tiempo de estudio
const updateLessonProgress = async (req, res) => {
    try {
        const { completed = false, timeSpent = 0 } = req.body;
        const { courseId, lessonId } = req.params;
        const userId = req.user.id;

        // Primero, verificar o crear el progreso a nivel curso
        const [courseProgress] = await db.Progress.findOrCreate({
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

        // Actualizar progreso de lección
        const [lessonProgress] = await db.Progress.findOrCreate({
            where: {
                userId,
                courseId,
                lessonId,
                isCourseLevelProgress: false
            },
            defaults: {
                completed: false,
                timeSpent: 0
            }
        });

        await lessonProgress.update({
            completed,
            timeSpent: lessonProgress.timeSpent + timeSpent,
            lastAccessedAt: new Date()
        });

        // Calcular progreso general del curso
        const totalLessons = await db.Lesson.count({ where: { courseId } });
        const completedLessons = await db.Progress.count({
            where: {
                userId,
                courseId,
                lessonId: { [Op.not]: null },
                completed: true,
                isCourseLevelProgress: false
            }
        });

        const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

        await courseProgress.update({
            progressPercentage,
            completed: progressPercentage === 100,
            lastAccessedAt: new Date()
        });

        res.json({
            success: true,
            data: {
                lessonProgress: {
                    completed: lessonProgress.completed,
                    timeSpent: lessonProgress.timeSpent
                },
                courseProgress: {
                    progressPercentage,
                    completed: progressPercentage === 100
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Obtener resumen de progreso de todos los cursos
const getAllCoursesProgress = async (req, res) => {
    try {
        const coursesProgress = await db.Progress.findAll({
            where: {
                userId: req.user.id,
                lessonId: null, // Solo progreso de cursos
            },
            include: [
                {
                    model: db.Course,
                    attributes: ["title", "level"],
                    include: [
                        {
                            model: db.Lesson,
                            attributes: ["id", "title"],
                        },
                    ],
                },
            ],
            order: [["lastAccessedAt", "DESC"]],
        });

        const progressSummary = coursesProgress.map((progress) => ({
            courseId: progress.courseId,
            courseTitle: progress.Course.title,
            level: progress.Course.level,
            progressPercentage: progress.progressPercentage,
            completed: progress.completed,
            timeSpent: progress.timeSpent,
            totalLessons: progress.Course.Lessons.length,
            lastAccessed: progress.lastAccessedAt,
        }));

        res.json({
            success: true,
            count: progressSummary.length,
            data: progressSummary,
        });
    } catch (error) {
        console.error("Error al obtener resumen de progreso:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener el resumen de progreso",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

module.exports = {
    getCourseProgress,
    getStudentStats,
    updateLessonProgress,
    getAllCoursesProgress,
};
