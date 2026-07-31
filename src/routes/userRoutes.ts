import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  addAddress,
  removeAddress,
} from "../controllers/user/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.post("/addresses", addAddress);
router.delete("/addresses/:index", removeAddress);

export default router;
