const db = require("../models");
const { Op, fn, col, literal, distinct } = require("sequelize");

exports.getStudentStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const [activeCourses, completedCourses] = await Promise.all([
            db.Progress.count({
                where: {
                    userId,
                    progressPercentage: { [Op.lt]: 100 },
                    isCourseLevelProgress: true
                }
            }),
            db.Progress.count({
                where: {
                    userId,
                    progressPercentage: 100,
                    isCourseLevelProgress: true
                }
            })
        ]);

        const courseProgress = await db.Progress.findAll({
            where: {
                userId,
                isCourseLevelProgress: true
            },
            include: [{
                model: db.Course,
                attributes: ['id', 'title']
            }],
            attributes: ['progressPercentage']
        });

        res.json({
            success: true,
            data: { activeCourses, completedCourses, courseProgress }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getTeacherStats = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const [basicStats, courseStats] = await Promise.all([
            db.Course.findAndCountAll({
                where: { creatorId: teacherId }
            }),
            db.Course.findAll({
                where: { creatorId: teacherId },
                attributes: [
                    'id',
                    'title',
                    [db.sequelize.literal('(SELECT COUNT(DISTINCT "Progresses"."userId") FROM "Progresses" WHERE "Progresses"."courseId" = "Course"."id" AND "Progresses"."isCourseLevelProgress" = true)'), 'totalStudents'],
                    [db.sequelize.literal('(SELECT COUNT(DISTINCT "Progresses"."userId") FROM "Progresses" WHERE "Progresses"."courseId" = "Course"."id" AND "Progresses"."isCourseLevelProgress" = true AND "Progresses"."progressPercentage" = 100)'), 'completedStudents']
                ],
                raw: true
            })
        ]);

        const totalStudents = await db.Progress.count({
            where: {
                isCourseLevelProgress: true
            },
            include: [{
                model: db.Course,
                where: { creatorId: teacherId }
            }],
            distinct: true,
            col: 'userId'
        });

        res.json({
            success: true,
            data: {
                totalCourses: basicStats.count,
                totalStudents,
                courseStats: courseStats.map(course => ({
                    id: course.id,
                    title: course.title,
                    totalStudents: parseInt(course.totalStudents) || 0,
                    completedStudents: parseInt(course.completedStudents) || 0
                }))
            }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.exportTeacherStats = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const stats = await db.Course.findAll({
            where: { creatorId: teacherId },
            include: [{
                model: db.Progress,
                include: [{
                    model: db.User,
                    attributes: ['name', 'email']
                }]
            }],
            attributes: ['title', 'level', 'createdAt']
        });

        // Formato para Excel
        const data = stats.flatMap(course =>
            course.Progress.map(progress => ({
                'Curso': course.title,
                'Nivel': course.level,
                'Estudiante': progress.User.name,
                'Email': progress.User.email,
                'Progreso': `${progress.progressPercentage}%`,
                'Tiempo Dedicado': `${progress.timeSpent} min`,
                'Último Acceso': progress.lastAccessedAt
            }))
        );

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await db.Course.findOne({
            where: { id: courseId },
            include: [
                {
                    model: db.Progress,
                    as: 'progresses',
                    include: [{
                        model: db.User,
                        attributes: ['id', 'name', 'email']
                    }]
                },
                {
                    model: db.Lesson,
                    attributes: ['id']
                }
            ]
        });

        const totalLessons = course.Lessons.length;

        const students = course.progresses.reduce((acc, progress) => {
            if (!acc.some(s => s.id === progress.User.id)) {
                acc.push({
                    id: progress.User.id,
                    name: progress.User.name,
                    email: progress.User.email,
                    progress: progress.progressPercentage,
                    completedLessons: Math.round((progress.progressPercentage * totalLessons) / 100)
                });
            }
            return acc;
        }, []);

        res.json({
            success: true,
            data: {
                id: course.id,
                title: course.title,
                totalLessons,
                students
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAdminStats = async (req, res) => {
    try {
        const [studentStats, teachers, coursesStats] = await Promise.all([
            db.Course.findAll({
                attributes: [
                    [col('Category.level'), 'level'],
                    [fn('COUNT', col('progresses.userId')), 'studentCount']
                ],
                include: [
                    {
                        model: db.Category,
                        as: 'category',
                        attributes: []
                    },
                    {
                        model: db.Progress,
                        as: 'progresses',
                        attributes: [],
                        include: [{
                            model: db.User,
                            where: { role: 'student' },
                            attributes: []
                        }]
                    }
                ],
                group: ['Course.id', 'Category.level', 'Category.id'],
                distinct: true
            }),
            db.User.count({
                where: { role: 'teacher' }
            }),
            db.Course.findOne({
                attributes: [
                    [fn('COUNT', col('id')), 'total'],
                    [fn('SUM', literal('CASE WHEN "isPublished" = true THEN 1 ELSE 0 END')), 'active'],
                    [fn('COUNT', literal('CASE WHEN EXISTS (SELECT 1 FROM "Progress" WHERE "Progress"."courseId" = "Course"."id" AND "Progress"."progressPercentage" = 100) THEN 1 END')), 'completed']
                ]
            })
        ]);

        const studentsByLevel = studentStats.reduce((acc, stat) => {
            const level = stat.dataValues.level;
            if (level === 'secundaria') acc.secondary = parseInt(stat.dataValues.studentCount);
            if (level === 'preparatoria') acc.preparatory = parseInt(stat.dataValues.studentCount);
            return acc;
        }, { secondary: 0, preparatory: 0 });

        res.json({
            success: true,
            data: {
                students: studentsByLevel,
                teachers,
                courses: {
                    total: parseInt(coursesStats.dataValues.total) || 0,
                    active: parseInt(coursesStats.dataValues.active) || 0,
                    completed: parseInt(coursesStats.dataValues.completed) || 0
                }
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};