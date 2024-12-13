// Modelo para resultado de las evaluaciones
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const AssessmentResult = sequelize.define("AssessmentResult", {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Users",
                key: "id",
            },
        },
        assessmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Assessments",
                key: "id",
            },
        },
        score: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 100,
            },
        },
        answers: {
            type: DataTypes.JSONB,
            allowNull: false,
        },
        completedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        timeSpent: {
            type: DataTypes.INTEGER, // en minutos
            allowNull: false,
        },
    });

    return AssessmentResult;
};
