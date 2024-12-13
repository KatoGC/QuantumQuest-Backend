const db = require("../models");

// Crear una evaluación
const createAssessment = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { title, description, type, questions, duration, passingScore } =
            req.body;

        // Verificar que la lección existe
        const lesson = await db.Lesson.findByPk(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lección no encontrada",
            });
        }

        // Obtener el curso para verificar el creador
        const course = await db.Course.findByPk(lesson.courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Curso no encontrado",
            });
        }

        // Verificar que el usuario es el profesor del curso
        if (course.creatorId !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message:
                    "No tienes permiso para crear evaluaciones en esta lección",
            });
        }

        const assessment = await db.Assessment.create({
            title,
            description,
            type,
            questions,
            duration,
            passingScore,
            lessonId,
        });

        res.status(201).json({
            success: true,
            data: assessment,
        });
    } catch (error) {
        console.error("Error al crear evaluación:", error);
        res.status(500).json({
            success: false,
            message: "Error al crear la evaluación",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Obtener evaluación
const getAssessment = async (req, res) => {
    try {
        const { assessmentId } = req.params;

        const assessment = await db.Assessment.findByPk(assessmentId, {
            include: [
                {
                    model: db.Lesson,
                    attributes: ["title", "courseId"],
                    include: [
                        {
                            model: db.Course,
                            attributes: ["title", "creatorId"],
                        },
                    ],
                },
            ],
        });

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Evaluación no encontrada",
            });
        }

        // Si el usuario es estudiante, no enviar las respuestas correctas
        if (req.user.role === "student") {
            assessment.questions = assessment.questions.map((question) => {
                const { correctAnswer, ...questionWithoutAnswer } = question;
                return questionWithoutAnswer;
            });
        }

        res.json({
            success: true,
            data: assessment,
        });
    } catch (error) {
        console.error("Error al obtener evaluación:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener la evaluación",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Enviar respuestas de evaluación
const submitAssessment = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const { answers } = req.body;

        const assessment = await db.Assessment.findByPk(assessmentId);
        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Evaluación no encontrada",
            });
        }

        // Verificar si el estudiante ya completó esta evaluación
        const existingResult = await db.AssessmentResult.findOne({
            where: {
                userId: req.user.id,
                assessmentId,
            },
        });

        if (existingResult) {
            return res.status(400).json({
                success: false,
                message: "Ya has completado esta evaluación",
            });
        }

        // Calcular puntuación
        let correctAnswers = 0;
        assessment.questions.forEach((question, index) => {
            if (answers[index] === question.correctAnswer) {
                correctAnswers++;
            }
        });

        const score = Math.round(
            (correctAnswers / assessment.questions.length) * 100
        );

        // Guardar resultado
        const result = await db.AssessmentResult.create({
            userId: req.user.id,
            assessmentId,
            score,
            answers,
            timeSpent: req.body.timeSpent || 0,
        });

        // Crear notificación
        await db.Notification.create({
            userId: req.user.id,
            title: "Evaluación completada",
            message: `Has completado la evaluación "${assessment.title}" con una puntuación de ${score}%`,
            type: "assessment",
            relatedId: assessmentId,
            relatedType: "Assessment",
        });

        res.json({
            success: true,
            data: {
                score,
                passed: score >= assessment.passingScore,
                total: assessment.questions.length,
                correct: correctAnswers,
            },
        });
    } catch (error) {
        console.error("Error al enviar evaluación:", error);
        res.status(500).json({
            success: false,
            message: "Error al enviar la evaluación",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Obtener resultados de evaluación
const getAssessmentResults = async (req, res) => {
    try {
        const { assessmentId } = req.params;

        // Obtener la evaluación y sus relaciones
        const assessment = await db.Assessment.findByPk(assessmentId);
        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Evaluación no encontrada",
            });
        }

        // Obtener la lección y el curso
        const lesson = await db.Lesson.findByPk(assessment.lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lección no encontrada",
            });
        }

        const course = await db.Course.findByPk(lesson.courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Curso no encontrado",
            });
        }

        // Verificar permisos
        const isTeacher = course.creatorId === req.user.id;
        const isAdmin = req.user.role === "admin";
        const isStudent = req.user.role === "student";

        if (isStudent) {
            // Estudiantes solo pueden ver sus propios resultados
            const result = await db.AssessmentResult.findOne({
                where: {
                    assessmentId,
                    userId: req.user.id,
                },
                include: [
                    {
                        model: db.User,
                        attributes: ["name", "email"],
                    },
                ],
            });

            return res.json({
                success: true,
                data: {
                    personalResult: result,
                    assessmentTitle: assessment.title,
                },
            });
        }

        if (isTeacher || isAdmin) {
            // Profesores y admins pueden ver todos los resultados
            const results = await db.AssessmentResult.findAll({
                where: { assessmentId },
                include: [
                    {
                        model: db.User,
                        attributes: ["id", "name", "email"],
                    },
                ],
                order: [["createdAt", "DESC"]],
            });

            // Calcular estadísticas
            const totalSubmissions = results.length;
            const averageScore =
                totalSubmissions > 0
                    ? results.reduce((acc, curr) => acc + curr.score, 0) /
                      totalSubmissions
                    : 0;
            const passingScore = assessment.passingScore;
            const passedCount = results.filter(
                (result) => result.score >= passingScore
            ).length;

            return res.json({
                success: true,
                data: {
                    assessmentInfo: {
                        title: assessment.title,
                        description: assessment.description,
                        type: assessment.type,
                        passingScore,
                        lessonTitle: lesson.title,
                        courseTitle: course.title,
                    },
                    statistics: {
                        totalSubmissions,
                        averageScore: Math.round(averageScore * 100) / 100,
                        passRate:
                            totalSubmissions > 0
                                ? `${Math.round(
                                      (passedCount / totalSubmissions) * 100
                                )}%`
                                : "0%",
                        passedCount,
                        failedCount: totalSubmissions - passedCount,
                    },
                    results: results.map((result) => ({
                        studentName: result.User.name,
                        studentEmail: result.User.email,
                        score: result.score,
                        passed: result.score >= passingScore,
                        timeSpent: result.timeSpent,
                        submittedAt: result.createdAt,
                    })),
                },
            });
        }

        return res.status(403).json({
            success: false,
            message: "No tienes permiso para ver estos resultados",
        });
    } catch (error) {
        console.error("Error al obtener resultados:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener los resultados",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

module.exports = {
    createAssessment,
    getAssessment,
    submitAssessment,
    getAssessmentResults,
};
