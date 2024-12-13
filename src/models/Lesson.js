const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Lesson = sequelize.define("Lesson", {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        orderIndex: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        duration: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        videoUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        courseId: {
            // Agregamos este campo
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Courses",
                key: "id",
            },
        },
    });

    return Lesson;
};
