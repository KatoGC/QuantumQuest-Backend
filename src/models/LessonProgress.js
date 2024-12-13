const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const LessonProgress = sequelize.define(
        "LessonProgress",
        {
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "Users",
                    key: "id",
                },
            },
            lessonId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "Lessons",
                    key: "id",
                },
            },
            completed: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            completedAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: "LessonProgress",
            indexes: [
                {
                    unique: true,
                    fields: ["userId", "lessonId"],
                },
            ],
        }
    );

    return LessonProgress;
};
