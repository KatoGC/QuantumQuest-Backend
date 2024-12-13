const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { protect, authorize } = require("../middleware/auth");

// Rutas públicas
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategory);

// Rutas protegidas (solo admin)
router.post(
    "/",
    protect,
    authorize("admin"),
    categoryController.createCategory
);
router.put(
    "/:id",
    protect,
    authorize("admin"),
    categoryController.updateCategory
);

module.exports = router;
