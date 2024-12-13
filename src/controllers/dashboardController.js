const db = require("../models");
const { Op, fn, col, literal, distinct } = require("sequelize");

exports.getStudentStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const [activeCourses, completedCourses] = await Promise.all([
            db.Progress.count({
                where: {
                    userId,
                    progressPercentage: { [Op.lt]: 100 }
                }
            }),
            db.Progress.count({
                where: {
                    userId,
                    progressPercentage: 100
                }
            })
        ]);

        const courseProgress = await db.Progress.findAll({
            where: { userId },
            include: [{
                model: db.Course,
                attributes: ['id', 'title']  // Añadido 'id'
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
        const timeFrame = req.query.timeFrame || 'month';

        const startDate = new Date();
        switch (timeFrame) {
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
        }

        const [basicStats, courseStats] = await Promise.all([
            db.Course.findAndCountAll({
                where: { creatorId: teacherId },
                include: [{
                    model: db.Progress,
                    as: 'progresses',
                    attributes: ['userId', 'progressPercentage'],
                    required: false
                }]
            }),

            db.Course.findAll({
                where: { creatorId: teacherId },
                attributes: [
                    'id',
                    'title',
                    [fn('COUNT', col('progresses.id')), 'totalStudents'],
                    [fn('SUM', literal('CASE WHEN "progresses"."progressPercentage" = 100 THEN 1 ELSE 0 END')), 'completedStudents']
                ],
                include: [{
                    model: db.Progress,
                    as: 'progresses',
                    attributes: [],
                    required: false
                }],
                group: ['Course.id', 'Course.title']
            })
        ]);

        const totalStudents = new Set(basicStats.rows.flatMap(course =>
            course.progresses?.map(p => p.userId) || []
        )).size;

        const monthlyProgress = basicStats.rows.reduce((acc, course) => {
            const progressData = course.progresses?.filter(p => new Date(p.updatedAt) >= startDate) || [];
            if (progressData.length) {
                const avgProgress = progressData.reduce((sum, p) => sum + p.progressPercentage, 0) / progressData.length;
                acc.push({
                    month: new Date().toLocaleString('default', { month: 'short' }),
                    completionRate: avgProgress
                });
            }
            return acc;
        }, []);

        res.json({
            success: true,
            data: {
                totalCourses: basicStats.count,
                activeCourses: basicStats.rows.filter(c => c.isPublished).length,
                totalStudents,
                courseStats: courseStats.map(course => ({
                    id: course.id,
                    title: course.title,
                    totalStudents: parseInt(course.dataValues.totalStudents) || 0,
                    completedStudents: parseInt(course.dataValues.completedStudents) || 0
                })),
                monthlyProgress,
                engagementMetrics: courseStats.map(course => ({
                    course: course.title,
                    views: parseInt(course.dataValues.totalStudents) || 0,
                    completions: parseInt(course.dataValues.completedStudents) || 0
                }))
            }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
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