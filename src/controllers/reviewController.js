const db = require("../models");

// Crear una review
const createReview = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { rating, comment } = req.body;

        // Verificar que el curso existe
        const course = await db.Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Curso no encontrado",
            });
        }

        // Verificar inscripción usando el modelo de Progress
        const enrollment = await db.Progress.findOne({
            where: {
                userId: req.user.id,
                courseId: courseId,
            },
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message:
                    "Debes estar inscrito en el curso para dejar una reseña",
            });
        }

        // Verificar si el usuario ya ha dejado una review
        const existingReview = await db.Review.findOne({
            where: {
                userId: req.user.id,
                courseId,
            },
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "Ya has dejado una reseña para este curso",
            });
        }

        // Crear la review
        const review = await db.Review.create({
            userId: req.user.id,
            courseId,
            rating,
            comment,
        });

        // Crear notificación para el profesor
        await db.Notification.create({
            userId: course.creatorId,
            title: "Nueva reseña en tu curso",
            message: `Un estudiante ha dejado una reseña en "${course.title}"`,
            type: "review",
            relatedId: review.id,
            relatedType: "Review",
        });

        // Obtener el promedio actualizado de calificaciones
        const avgRating = await db.Review.findOne({
            where: { courseId },
            attributes: [
                [
                    db.sequelize.fn("AVG", db.sequelize.col("rating")),
                    "averageRating",
                ],
                [
                    db.sequelize.fn("COUNT", db.sequelize.col("id")),
                    "totalReviews",
                ],
            ],
        });

        res.status(201).json({
            success: true,
            data: {
                review,
                courseStats: {
                    averageRating: Number(
                        avgRating.dataValues.averageRating
                    ).toFixed(1),
                    totalReviews: avgRating.dataValues.totalReviews,
                },
            },
        });
    } catch (error) {
        console.error("Error al crear reseña:", error);
        res.status(500).json({
            success: false,
            message: "Error al crear la reseña",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Obtener reviews de un curso
const getCourseReviews = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { page = 1, limit = 10, sort = "recent" } = req.query;

        // Verificar que el curso existe
        const course = await db.Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Curso no encontrado",
            });
        }

        // Configurar el orden según el parámetro sort
        let order = [["createdAt", "DESC"]]; // por defecto, más recientes primero
        if (sort === "rating-high") order = [["rating", "DESC"]];
        if (sort === "rating-low") order = [["rating", "ASC"]];

        // Obtener reviews con paginación
        const reviews = await db.Review.findAndCountAll({
            where: { courseId },
            include: [
                {
                    model: db.User,
                    attributes: ["name", "email"],
                },
            ],
            order,
            limit: Number(limit),
            offset: (Number(page) - 1) * Number(limit),
        });

        // Obtener estadísticas generales
        const stats = await db.Review.findOne({
            where: { courseId },
            attributes: [
                [
                    db.sequelize.fn("AVG", db.sequelize.col("rating")),
                    "averageRating",
                ],
                [
                    db.sequelize.fn("COUNT", db.sequelize.col("id")),
                    "totalReviews",
                ],
                [
                    db.sequelize.fn(
                        "COUNT",
                        db.sequelize.literal("CASE WHEN rating = 5 THEN 1 END")
                    ),
                    "fiveStars",
                ],
                [
                    db.sequelize.fn(
                        "COUNT",
                        db.sequelize.literal("CASE WHEN rating = 4 THEN 1 END")
                    ),
                    "fourStars",
                ],
                [
                    db.sequelize.fn(
                        "COUNT",
                        db.sequelize.literal("CASE WHEN rating = 3 THEN 1 END")
                    ),
                    "threeStars",
                ],
                [
                    db.sequelize.fn(
                        "COUNT",
                        db.sequelize.literal("CASE WHEN rating = 2 THEN 1 END")
                    ),
                    "twoStars",
                ],
                [
                    db.sequelize.fn(
                        "COUNT",
                        db.sequelize.literal("CASE WHEN rating = 1 THEN 1 END")
                    ),
                    "oneStar",
                ],
            ],
        });

        res.json({
            success: true,
            data: {
                reviews: reviews.rows,
                pagination: {
                    total: reviews.count,
                    page: Number(page),
                    pages: Math.ceil(reviews.count / limit),
                },
                stats: {
                    averageRating: Number(
                        stats.dataValues.averageRating
                    ).toFixed(1),
                    totalReviews: stats.dataValues.totalReviews,
                    distribution: {
                        5: stats.dataValues.fiveStars,
                        4: stats.dataValues.fourStars,
                        3: stats.dataValues.threeStars,
                        2: stats.dataValues.twoStars,
                        1: stats.dataValues.oneStar,
                    },
                },
            },
        });
    } catch (error) {
        console.error("Error al obtener reseñas:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener las reseñas",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Actualizar una review
const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;

        const review = await db.Review.findOne({
            where: {
                id: reviewId,
                userId: req.user.id,
            },
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message:
                    "Reseña no encontrada o no tienes permiso para editarla",
            });
        }

        const updatedReview = await review.update({
            rating,
            comment,
        });

        res.json({
            success: true,
            data: updatedReview,
        });
    } catch (error) {
        console.error("Error al actualizar reseña:", error);
        res.status(500).json({
            success: false,
            message: "Error al actualizar la reseña",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Eliminar una review
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await db.Review.findOne({
            where: {
                id: reviewId,
                userId: req.user.id,
            },
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message:
                    "Reseña no encontrada o no tienes permiso para eliminarla",
            });
        }

        await review.destroy();

        res.json({
            success: true,
            message: "Reseña eliminada exitosamente",
        });
    } catch (error) {
        console.error("Error al eliminar reseña:", error);
        res.status(500).json({
            success: false,
            message: "Error al eliminar la reseña",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

module.exports = {
    createReview,
    getCourseReviews,
    updateReview,
    deleteReview,
};
