const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    dialectOptions: {
        charset: "utf8",
        collate: "utf8_general_ci",
    },
});

// Importar definiciones de modelos
const UserModel = require("./User");
const CourseModel = require("./Course");
const LessonModel = require("./Lesson");
const ProgressModel = require("./Progress");
const AssessmentModel = require("./Assessment");
const AssessmentResultModel = require("./AssessmentResult");
const ReviewModel = require("./Review");
const NotificationModel = require("./Notification");
const CategoryModel = require("./Category");

// Inicializar modelos
const User = UserModel(sequelize);
const Course = CourseModel(sequelize);
const Lesson = LessonModel(sequelize);
const Progress = ProgressModel(sequelize);
const Assessment = AssessmentModel(sequelize);
const AssessmentResult = AssessmentResultModel(sequelize);
const Review = ReviewModel(sequelize);
const Notification = NotificationModel(sequelize);
const Category = CategoryModel(sequelize);

// Definir relaciones
// Users - Courses (creador)
Course.belongsTo(User, {
    as: "creator",
    foreignKey: {
        name: "creatorId",
        allowNull: false,
    },
});
User.hasMany(Course, {
    as: "createdCourses",
    foreignKey: "creatorId",
});

// Relación Course - Lesson
Course.hasMany(Lesson, {
    foreignKey: {
        name: "courseId",
        allowNull: false,
    },
    onDelete: "CASCADE",
});

Course.hasMany(Progress, {
    foreignKey: "courseId",
    as: "progresses"
});

Progress.belongsTo(Course, {
    foreignKey: "courseId"
});

Lesson.belongsTo(Course, { foreignKey: "courseId" });

// Users - Courses (estudiantes)
User.belongsToMany(Course, {
    through: "Enrollments",
    as: "enrolledCourses",
    foreignKey: "userId",
});
Course.belongsToMany(User, {
    through: "Enrollments",
    as: "students",
    foreignKey: "courseId",
});

// Progress
Progress.belongsTo(User, {
    foreignKey: "userId",
    allowNull: false
});

Progress.belongsTo(Lesson, {
    foreignKey: "lessonId",
});

// Relación Lesson - Assessment
Lesson.hasMany(Assessment, {
    foreignKey: {
        name: "lessonId",
        allowNull: false,
    },
    onDelete: "CASCADE",
});
Assessment.belongsTo(Lesson, { foreignKey: "lessonId" });

// Relación Assessment - AssessmentResult
Assessment.hasMany(AssessmentResult, {
    foreignKey: {
        name: "assessmentId",
        allowNull: false,
    },
    onDelete: "CASCADE",
});
AssessmentResult.belongsTo(Assessment, { foreignKey: "assessmentId" });

AssessmentResult.belongsTo(User, {
    foreignKey: {
        name: "userId",
        allowNull: false,
    },
});
User.hasMany(AssessmentResult, { foreignKey: "userId" });

// Relaciones para reviews
Course.hasMany(Review, {
    foreignKey: {
        name: "courseId",
        allowNull: false,
    },
    onDelete: "CASCADE",
});

Review.belongsTo(Course, { foreignKey: "courseId" });

User.hasMany(Review, {
    foreignKey: {
        name: "userId",
        allowNull: false,
    },
});
Review.belongsTo(User, { foreignKey: "userId" });

// Relaciones para notificaciones
User.hasMany(Notification, {
    foreignKey: {
        name: "userId",
        allowNull: false,
    },
    onDelete: "CASCADE",
});
Notification.belongsTo(User, { foreignKey: "userId" });

// Relación Category - Course
Category.hasMany(Course, {
    foreignKey: {
        name: "categoryId",
        allowNull: true,
    },
    as: "courses", // Agregamos el alias
    onDelete: "SET NULL",
});

Course.belongsTo(Category, { foreignKey: "categoryId" });

// Sincronizar modelos con la base de datos
const syncDatabase = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log("Base de datos sincronizada correctamente");
    } catch (error) {
        console.error("Error al sincronizar la base de datos:", error);
    }
};

// Exportar todo como un objeto
const db = {
    sequelize,
    User,
    Course,
    Lesson,
    Progress,
    Assessment,
    AssessmentResult,
    Review,
    Notification,
    Category,
    syncDatabase,
};

module.exports = db;
