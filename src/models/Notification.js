// Modelo para notificaciones
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Notification = sequelize.define("Notification", {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Users",
                key: "id",
            },
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM(
                "assessment",
                "progress",
                "review",
                "course",
                "system",
                "course_created",
                "enrollment",
                "assessment_completed",
                "course_completed"
            ),
            allowNull: false,
        },
        read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        relatedId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        relatedType: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    });

    return Notification;
};
