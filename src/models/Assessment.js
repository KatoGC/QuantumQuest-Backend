// Modelo para las evaluaciones
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Assessment = sequelize.define("Assessment", {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        lessonId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Lessons",
                key: "id",
            },
        },
        type: {
            type: DataTypes.ENUM("quiz", "assignment", "exam"),
            allowNull: false,
        },
        questions: {
            type: DataTypes.JSONB,
            allowNull: false,
        },
        duration: {
            type: DataTypes.INTEGER, // en minutos
            allowNull: true,
        },
        passingScore: {
            type: DataTypes.INTEGER,
            defaultValue: 60,
            validate: {
                min: 0,
                max: 100,
            },
        },
    });

    return Assessment;
};
