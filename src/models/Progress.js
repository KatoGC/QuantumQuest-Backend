const { DataTypes } = require("sequelize");
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
        },
    });

    Progress.associate = (models) => {
        Progress.belongsTo(models.Course);
        Progress.belongsTo(models.User);
        Progress.belongsTo(models.Lesson);
    };

    return Progress;
};