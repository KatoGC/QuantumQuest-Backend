const { body, param, query, validationResult } = require("express-validator");

// Función para manejar los resultados de la validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
};

// Validaciones para cursos
const courseValidators = {
    create: [
        body("title")
            .trim()
            .notEmpty()
            .withMessage("El título es obligatorio")
            .isLength({ min: 3, max: 100 })
            .withMessage("El título debe tener entre 3 y 100 caracteres"),
        body("description")
            .trim()
            .notEmpty()
            .withMessage("La descripción es obligatoria")
            .isLength({ min: 10, max: 1000 })
            .withMessage(
                "La descripción debe tener entre 10 y 1000 caracteres"
            ),
        body("level")
            .optional()
            .isIn(["beginner", "intermediate", "advanced"])
            .withMessage("El nivel debe ser beginner, intermediate o advanced"),
        body("price")
            .optional()
            .isFloat({ min: 0 })
            .withMessage("El precio debe ser un número positivo"),
        handleValidationErrors,
    ],
    update: [
        param("id").isInt().withMessage("ID de curso inválido"),
        body("title")
            .optional()
            .trim()
            .isLength({ min: 3, max: 100 })
            .withMessage("El título debe tener entre 3 y 100 caracteres"),
        body("description")
            .optional()
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage(
                "La descripción debe tener entre 10 y 1000 caracteres"
            ),
        body("level")
            .optional()
            .isIn(["beginner", "intermediate", "advanced"])
            .withMessage("El nivel debe ser beginner, intermediate o advanced"),
        body("price")
            .optional()
            .isFloat({ min: 0 })
            .withMessage("El precio debe ser un número positivo"),
        handleValidationErrors,
    ],
};

// Validaciones para lecciones
const lessonValidators = {
    create: [
        param("courseId").isInt().withMessage("ID de curso inválido"),
        body("title")
            .trim()
            .notEmpty()
            .withMessage("El título es obligatorio")
            .isLength({ min: 3, max: 100 })
            .withMessage("El título debe tener entre 3 y 100 caracteres"),
        body("content")
            .trim()
            .notEmpty()
            .withMessage("El contenido es obligatorio")
            .isLength({ min: 10 })
            .withMessage("El contenido debe tener al menos 10 caracteres"),
        body("orderIndex")
            .isInt({ min: 0 })
            .withMessage(
                "El índice de orden debe ser un número entero positivo"
            ),
        body("duration")
            .optional()
            .isInt({ min: 1 })
            .withMessage("La duración debe ser un número entero positivo"),
        body("videoUrl")
            .optional()
            .isURL()
            .withMessage("La URL del video debe ser válida"),
        handleValidationErrors,
    ],
    update: [
        param("courseId").isInt().withMessage("ID de curso inválido"),
        param("id").isInt().withMessage("ID de lección inválido"),
        body("title")
            .optional()
            .trim()
            .isLength({ min: 3, max: 100 })
            .withMessage("El título debe tener entre 3 y 100 caracteres"),
        body("content")
            .optional()
            .trim()
            .isLength({ min: 10 })
            .withMessage("El contenido debe tener al menos 10 caracteres"),
        body("orderIndex")
            .optional()
            .isInt({ min: 0 })
            .withMessage(
                "El índice de orden debe ser un número entero positivo"
            ),
        body("duration")
            .optional()
            .isInt({ min: 1 })
            .withMessage("La duración debe ser un número entero positivo"),
        body("videoUrl")
            .optional()
            .isURL()
            .withMessage("La URL del video debe ser válida"),
        handleValidationErrors,
    ],
};

// Validaciones para progreso
const progressValidators = {
    updateProgress: [
        param("courseId").isInt().withMessage("ID de curso inválido"),
        param("lessonId").isInt().withMessage("ID de lección inválido"),
        body("completed")
            .isBoolean()
            .withMessage("El campo completed debe ser true o false"),
        body("timeSpent")
            .optional()
            .isInt({ min: 0 })
            .withMessage("El tiempo debe ser un número entero positivo"),
        handleValidationErrors,
    ],
    getProgress: [
        param("courseId").isInt().withMessage("ID de curso inválido"),
        handleValidationErrors,
    ],
    filterProgress: [
        query("startDate")
            .optional()
            .isISO8601()
            .withMessage("La fecha de inicio debe ser válida"),
        query("endDate")
            .optional()
            .isISO8601()
            .withMessage("La fecha de fin debe ser válida"),
        query("level")
            .optional()
            .isIn(["beginner", "intermediate", "advanced"])
            .withMessage("El nivel debe ser beginner, intermediate o advanced"),
        handleValidationErrors,
    ],
};

// Validaciones para autenticación
const authValidators = {
    register: [
        body("name")
            .trim()
            .notEmpty()
            .withMessage("El nombre es obligatorio")
            .isLength({ min: 2, max: 50 })
            .withMessage("El nombre debe tener entre 2 y 50 caracteres"),
        body("email")
            .trim()
            .notEmpty()
            .withMessage("El email es obligatorio")
            .isEmail()
            .withMessage("Debe ser un email válido")
            .normalizeEmail(),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("La contraseña es obligatoria")
            .isLength({ min: 6 })
            .withMessage("La contraseña debe tener al menos 6 caracteres")
            .matches(/\d/)
            .withMessage("La contraseña debe contener al menos un número"),
        handleValidationErrors,
    ],
    login: [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("El email es obligatorio")
            .isEmail()
            .withMessage("Debe ser un email válido")
            .normalizeEmail(),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("La contraseña es obligatoria"),
        handleValidationErrors,
    ],
};

module.exports = {
    courseValidators,
    lessonValidators,
    progressValidators,
    authValidators,
};
