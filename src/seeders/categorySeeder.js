const db = require("../models");

const createCategories = async () => {
    try {
        // Categorías para Secundaria
        const secundariaCategories = [
            {
                name: "Matemáticas 1° Secundaria",
                slug: "matematicas-1-secundaria",
                level: "secundaria",
                grade: 1,
                description:
                    "Aritmética, álgebra básica y geometría fundamental",
                order: 1,
            },
            {
                name: "Matemáticas 2° Secundaria",
                slug: "matematicas-2-secundaria",
                level: "secundaria",
                grade: 2,
                description:
                    "Álgebra intermedia, geometría y probabilidad básica",
                order: 2,
            },
            {
                name: "Matemáticas 3° Secundaria",
                slug: "matematicas-3-secundaria",
                level: "secundaria",
                grade: 3,
                description:
                    "Álgebra avanzada, geometría analítica y estadística",
                order: 3,
            },
        ];

        // Categorías para Preparatoria
        const preparatoriaCategories = [
            {
                name: "Matemáticas I - Preparatoria",
                slug: "matematicas-1-preparatoria",
                level: "preparatoria",
                grade: 1,
                description: "Álgebra avanzada y trigonometría",
                order: 4,
            },
            {
                name: "Matemáticas II - Preparatoria",
                slug: "matematicas-2-preparatoria",
                level: "preparatoria",
                grade: 2,
                description: "Geometría analítica y cálculo diferencial",
                order: 5,
            },
            {
                name: "Matemáticas III - Preparatoria",
                slug: "matematicas-3-preparatoria",
                level: "preparatoria",
                grade: 3,
                description: "Cálculo integral y probabilidad avanzada",
                order: 6,
            },
        ];

        // Crear todas las categorías
        const allCategories = [
            ...secundariaCategories,
            ...preparatoriaCategories,
        ];

        for (const category of allCategories) {
            await db.Category.findOrCreate({
                where: { slug: category.slug },
                defaults: category,
            });
        }

        console.log("Categorías creadas exitosamente");
    } catch (error) {
        console.error("Error al crear categorías:", error);
        throw error;
    }
};

module.exports = createCategories;
