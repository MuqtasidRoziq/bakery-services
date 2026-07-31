import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  createPayment,
  confirmPayment,
} from "../controllers/order/orderController.js";
import { authMiddleware, adminMiddleware, customerMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// Customer routes
router.post("/", authMiddleware, customerMiddleware, createOrder);
router.get("/my", authMiddleware, customerMiddleware, getMyOrders);
router.patch("/:id/cancel", authMiddleware, customerMiddleware, cancelOrder);
router.post("/:id/payment", authMiddleware, customerMiddleware, createPayment);

// Shared (customer + admin)
router.get("/:id", authMiddleware, getOrderById);

// Admin routes
router.get("/", authMiddleware, adminMiddleware, getAllOrders);
router.patch("/:id/status", authMiddleware, adminMiddleware, updateOrderStatus);
router.patch("/payments/:paymentId/confirm", authMiddleware, adminMiddleware, confirmPayment);

export default router;
