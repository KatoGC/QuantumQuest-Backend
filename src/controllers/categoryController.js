const db = require("../models");
const { Op } = require("sequelize");

const categoryController = {
    getAllCategories: async (req, res) => {
        try {
            const {
                level,
                grade,
                search,
                orderBy = "grade",
                orderDir = "ASC",
            } = req.query;
            const where = {};

            if (level) {
                where.level = level;
            }
            if (grade) {
                where.grade = grade;
            }

            if (search) {
                where[Op.or] = [
                    {
                        name: {
                            [Op.iLike]: `%${search}%`,
                        },
                    },
                    {
                        description: {
                            [Op.iLike]: `%${search}%`,
                        },
                    },
                ];
            }

            // Configurar el orden basado en los parámetros
            let order = [];
            switch (orderBy) {
                case "name":
                    order.push(["name", orderDir]);
                    break;
                case "grade":
                    order.push(["grade", orderDir]);
                    break;
                default:
                    order.push(["grade", "ASC"]);
            }

            const categories = await db.Category.findAll({
                where,
                order,
                raw: true,
            });

            const categoriesWithCount = await Promise.all(
                categories.map(async (category) => {
                    const courseCount = await db.Course.count({
                        where: { categoryId: category.id },
                    });

                    return {
                        ...category,
                        courseCount,
                    };
                })
            );

            // Si el ordenamiento es por courseCount, lo hacemos después de obtener los conteos
            if (orderBy === "courseCount") {
                categoriesWithCount.sort((a, b) => {
                    return orderDir === "ASC"
                        ? a.courseCount - b.courseCount
                        : b.courseCount - a.courseCount;
                });
            }
            
            res.json({
                success: true,
                data: categoriesWithCount,
            });
        } catch (error) {
            console.error("Error al obtener categorías:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener las categorías",
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
            });
        }
    },

    getCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const category = await db.Category.findByPk(id, {
                include: [
                    {
                        model: db.Course,
                        as: "courses",
                        include: [
                            {
                                model: db.User,
                                as: "creator",
                                attributes: ["id", "name"],
                            },
                        ],
                    },
                ],
            });

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: "Categoría no encontrada",
                });
            }

            res.json({
                success: true,
                data: category,
            });
        } catch (error) {
            console.error("Error al obtener detalles de categoría:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener los detalles de la categoría",
            });
        }
    },

    // Por ahora estos métodos retornarán un error ya que no están implementados
    createCategory: async (req, res) => {
        res.status(501).json({
            success: false,
            message: "Función no implementada",
        });
    },

    updateCategory: async (req, res) => {
        res.status(501).json({
            success: false,
            message: "Función no implementada",
        });
    },
};

module.exports = categoryController;
