// Modelo para comentarios y valoraciones
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Review = sequelize.define(
        "Review",
        {
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
            rating: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    min: 1,
                    max: 5,
                },
            },
            comment: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            isPublished: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            indexes: [
                {
                    unique: true,
                    fields: ["userId", "courseId"],
                },
            ],
        }
    );

    return Review;
};
