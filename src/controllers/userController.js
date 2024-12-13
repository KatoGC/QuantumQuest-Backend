const db = require("../models");

const getEnrolledCourses = async (req, res) => {
    try {
        const enrolledCourses = await db.Progress.findAll({
            where: { userId: req.params.id },
            include: [
                {
                    model: db.Course,
                    include: [
                        {
                            model: db.Lesson,
                            attributes: ["id"],
                        },
                        {
                            model: db.User,
                            as: "creator",
                            attributes: ["name"],
                        },
                    ],
                },
            ],
            attributes: ["progressPercentage", "updatedAt"],
        });

        const formattedCourses = enrolledCourses.map((progress) => ({
            id: progress.Course.id,
            title: progress.Course.title,
            description: progress.Course.description,
            instructor: progress.Course.creator.name,
            progress: progress.progressPercentage,
            lastAccessed: progress.updatedAt,
            totalLessons: progress.Course.Lessons.length,
            imageUrl: progress.Course.imageUrl,
        }));

        res.json({
            success: true,
            data: formattedCourses,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, bio } = req.body;

        const user = await db.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        const updatedUser = await user.update({
            name,
            bio
        });

        const userData = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            bio: updatedUser.bio,
            role: updatedUser.role,
            isVerified: updatedUser.isVerified
        };

        res.json({
            success: true,
            data: userData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getEnrolledCourses,
    updateProfile
};