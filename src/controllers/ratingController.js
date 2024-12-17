const db = require('../models');

exports.rateCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { rating } = req.body;
        const userId = req.user.id;

        // Verificar progreso
        const progress = await db.Progress.findOne({
            where: {
                userId,
                courseId,
                progressPercentage: 100,
                isCourseLevelProgress: true
            }
        });

        if (!progress) {
            return res.status(403).json({
                success: false,
                message: "Debes completar el curso antes de calificarlo"
            });
        }

        // Guardar o actualizar rating
        const [courseRating] = await db.Rating.findOrCreate({
            where: { userId, courseId },
            defaults: { rating }
        });

        if (courseRating.rating !== rating) {
            await courseRating.update({ rating });
        }

        // Calcular promedio
        const avgRating = await db.Rating.findOne({
            where: { courseId },
            attributes: [
                [db.sequelize.fn('AVG', db.sequelize.col('rating')), 'average'],
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total']
            ]
        });

        await db.Course.update(
            {
                averageRating: avgRating.getDataValue('average'),
                totalRatings: avgRating.getDataValue('total')
            },
            { where: { id: courseId } }
        );

        res.json({
            success: true,
            data: {
                userRating: rating,
                averageRating: avgRating.getDataValue('average')
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseRating = async (req, res) => {
    try {
        const { courseId } = req.params;

        const ratings = await db.Rating.findAll({
            where: { courseId },
            include: [{
                model: db.User,
                attributes: ['name']
            }]
        });

        const averageRating = await db.Rating.findOne({
            where: { courseId },
            attributes: [
                [db.sequelize.fn('AVG', db.sequelize.col('rating')), 'average'],
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total']
            ]
        });

        res.json({
            success: true,
            data: {
                ratings,
                stats: {
                    average: parseFloat(averageRating.getDataValue('average')),
                    total: parseInt(averageRating.getDataValue('total'))
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};