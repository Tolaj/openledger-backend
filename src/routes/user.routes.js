import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { userController } from "../controllers/index.js";

const router = Router();

router.get("/me", requireAuth, userController.getMe);
router.patch("/:id", userController.update);

export default router;
