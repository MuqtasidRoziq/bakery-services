import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from "../controllers/cart/cartController.js";
import { authMiddleware, customerMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// All cart routes require a logged in customer
router.use(authMiddleware);
router.use(customerMiddleware);

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:itemId", updateCartItem);
router.delete("/:itemId", removeFromCart);
router.delete("/", clearCart);

export default router;
