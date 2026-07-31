import { Router } from "express";
import { register } from "../controllers/auth/registerController.js";
import { login } from "../controllers/auth/loginController.js";
import { getMe } from "../controllers/auth/getMeController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);

export default router;
