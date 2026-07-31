import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  getAllCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
} from "../controllers/product/productController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// Public
router.get("/", getAllProducts);
router.get("/categories", getAllCategories);
router.get("/:id", getProductById);

// Admin only
router.post("/", authMiddleware, adminMiddleware, createProduct);
router.patch("/:id", authMiddleware, adminMiddleware, updateProduct);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);
router.post("/categories", authMiddleware, adminMiddleware, createCategory);

export default router;
