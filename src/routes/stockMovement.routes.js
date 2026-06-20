import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { stockMovementController } from "../controllers/stockMovement.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", stockMovementController.getAll);
router.post("/adjustment", stockMovementController.createAdjustment);

export default router;
