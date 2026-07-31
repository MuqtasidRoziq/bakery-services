import { Router } from "express";
import {
  getAllUsers,
  setAdmin,
  revokeAdmin,
  deactivateUser,
} from "../controllers/admin/adminController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/users", getAllUsers);
router.post("/users/:id/set-admin", setAdmin);
router.delete("/users/:id/set-admin", revokeAdmin);
router.patch("/users/:id/deactivate", deactivateUser);

export default router;
