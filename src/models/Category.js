const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Category = sequelize.define(
        "Category",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            slug: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            level: {
                type: DataTypes.ENUM("secundaria", "preparatoria"),
                allowNull: false,
            },
            grade: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    min: 1,
                    max: 3,
                },
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            order: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            tableName: "categories",
            timestamps: true,
        }
    );

    return Category;
};
