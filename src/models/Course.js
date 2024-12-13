const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
    const Course = sequelize.define(
        "Course",
        {
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            level: {
                type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
                defaultValue: "beginner",
            },
            imageUrl: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            isPublished: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            price: {
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0.0,
            },
            creatorId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "Users",
                    key: "id",
                },
            },
            resources: {
                type: DataTypes.JSONB,
                defaultValue: [],
            },
        },
        {
            tableName: "Courses",
            timestamps: true,
        }
    );

    Course.associate = (models) => {
        Course.belongsTo(models.User, {
            as: 'creator',
            foreignKey: 'creatorId'
        });
        Course.hasMany(models.Progress, {
            foreignKey: 'courseId'
        });
        Course.hasMany(models.Lesson, {
            foreignKey: 'courseId'
        });
    };

    return Course;
};