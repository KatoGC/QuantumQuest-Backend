const { DataTypes, Op } = require("sequelize");

module.exports = (sequelize) => {
    const Progress = sequelize.define("Progress", {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Users",
                key: "id",
            },
        },
        courseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Courses",
                key: "id",
            },
        },
        lessonId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "Lessons",
                key: "id",
            },
        },
        isCourseLevelProgress: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        progressPercentage: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 100,
            },
        },
        timeSpent: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        lastAccessedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['userId', 'courseId', 'lessonId'],
                where: {
                    lessonId: {
                        [Op.not]: null
                    }
                }
            },
            {
                unique: true,
                fields: ['userId', 'courseId'],
                where: {
                    lessonId: null,
                    isCourseLevelProgress: true
                }
            }
        ]
    });

    Progress.associate = (models) => {
        Progress.belongsTo(models.Course);
        Progress.belongsTo(models.User);
        Progress.belongsTo(models.Lesson);
    };

    return Progress;
};