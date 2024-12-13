const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} = require("../controllers/notificationController");

// Obtener notificaciones del usuario
router.get("/notifications", protect, getNotifications);

// Marcar notificación como leída
router.put("/notifications/:notificationId/read", protect, markAsRead);

// Marcar todas las notificaciones como leídas
router.put("/notifications/read-all", protect, markAllAsRead);

// Eliminar notificación
router.delete("/notifications/:notificationId", protect, deleteNotification);

module.exports = router;
