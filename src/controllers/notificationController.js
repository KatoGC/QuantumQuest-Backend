const db = require("../models");
const { Op } = require("sequelize");

// Obtener notificaciones del usuario
const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 10, unreadOnly = false } = req.query;

        const whereClause = {
            userId: req.user.id,
        };

        if (unreadOnly === "true") {
            whereClause.read = false;
        }

        const notifications = await db.Notification.findAndCountAll({
            where: whereClause,
            order: [["createdAt", "DESC"]],
            limit: Number(limit),
            offset: (Number(page) - 1) * Number(limit),
        });

        // Obtener contador de no leídas
        const unreadCount = await db.Notification.count({
            where: {
                userId: req.user.id,
                read: false,
            },
        });

        res.json({
            success: true,
            data: {
                notifications: notifications.rows,
                pagination: {
                    total: notifications.count,
                    page: Number(page),
                    pages: Math.ceil(notifications.count / limit),
                },
                unreadCount,
            },
        });
    } catch (error) {
        console.error("Error al obtener notificaciones:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener notificaciones",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Marcar notificación como leída
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await db.Notification.findOne({
            where: {
                id: notificationId,
                userId: req.user.id,
            },
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notificación no encontrada",
            });
        }

        await notification.update({ read: true });

        res.json({
            success: true,
            data: notification,
        });
    } catch (error) {
        console.error("Error al marcar notificación:", error);
        res.status(500).json({
            success: false,
            message: "Error al marcar la notificación",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Marcar todas las notificaciones como leídas
const markAllAsRead = async (req, res) => {
    try {
        await db.Notification.update(
            { read: true },
            {
                where: {
                    userId: req.user.id,
                    read: false,
                },
            }
        );

        res.json({
            success: true,
            message: "Todas las notificaciones han sido marcadas como leídas",
        });
    } catch (error) {
        console.error("Error al marcar notificaciones:", error);
        res.status(500).json({
            success: false,
            message: "Error al marcar las notificaciones",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Eliminar notificación
const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await db.Notification.findOne({
            where: {
                id: notificationId,
                userId: req.user.id,
            },
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notificación no encontrada",
            });
        }

        await notification.destroy();

        res.json({
            success: true,
            message: "Notificación eliminada exitosamente",
        });
    } catch (error) {
        console.error("Error al eliminar notificación:", error);
        res.status(500).json({
            success: false,
            message: "Error al eliminar la notificación",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Crear una notificación (función auxiliar para usar en otros controladores)
const createNotification = async ({
    userId,
    title,
    message,
    type,
    relatedId,
    relatedType,
}) => {
    try {
        const notification = await db.Notification.create({
            userId,
            title,
            message,
            type,
            relatedId,
            relatedType,
            read: false,
        });
        return notification;
    } catch (error) {
        console.error("Error al crear notificación:", error);
        throw error;
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
};
