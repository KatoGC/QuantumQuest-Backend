const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize) => {
    const User = sequelize.define(
        "User",
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                },
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            role: {
                type: DataTypes.ENUM("student", "teacher", "admin"),
                defaultValue: "student",
            },
            bio: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            verificationToken: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            verificationTokenExpires: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            isVerified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            hooks: {
                beforeSave: async (user) => {
                    if (user.changed("password")) {
                        const salt = await bcrypt.genSalt(10);
                        user.password = await bcrypt.hash(user.password, salt);
                    }
                },
            },
        }
    );

    User.prototype.comparePassword = async function (candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    };
    User.associate = (models) => {
        User.hasMany(models.Progress, {
            foreignKey: 'userId'
        });
    };

    return User;
};
