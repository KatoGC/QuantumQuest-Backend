const express = require("express");
const router = express.Router({ mergeParams: true }); // Para acceder a courseId en las rutas
const lessonController = require("../controllers/lessonController");
const { protect, authorize } = require("../middleware/auth");

// Obtener todas las lecciones de un curso
router.get("/", lessonController.getLessons);

// Obtener una lección específica
router.get("/:id", lessonController.getLesson);

// Crear una nueva lección
router.post("/", protect, authorize("teacher", "admin"), lessonController.createLesson);

// Actualizar una lección
router.put("/:id", protect, authorize("teacher", "admin"), lessonController.updateLesson);

// Completar una lección
router.post("/:id/complete", protect, lessonController.completeLesson);

// Eliminar una lección
router.delete("/:id", protect, authorize("teacher", "admin"), lessonController.deleteLesson);


module.exports = router;
