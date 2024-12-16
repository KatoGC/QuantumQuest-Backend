const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Comment = sequelize.define("Comment", {
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: "Users",
                key: "id"
            }
        },
        courseId: {
            type: DataTypes.INTEGER,
            references: {
                model: "Courses",
                key: "id"
            }
        }
    })
    return Comment
}; 