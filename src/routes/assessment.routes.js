const express = require("express");
const router = express.Router({ mergeParams: true });
const { protect, authorize } = require("../middleware/auth");
const {
    createAssessment,
    getAssessment,
    submitAssessment,
    getAssessmentResults,
} = require("../controllers/assessmentController");

// Ruta para crear evaluación (solo profesores y admins)
router.post("/", protect, authorize("teacher", "admin"), createAssessment);

// Ruta para obtener evaluación
router.get("/:assessmentId", protect, getAssessment);

// Ruta para enviar respuestas (solo estudiantes)
router.post(
    "/:assessmentId/submit",
    protect,
    authorize("student"),
    submitAssessment
);

// Ruta para obtener resultados
router.get("/:assessmentId/results", protect, getAssessmentResults);

module.exports = router;
