import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { cartController } from "../controllers/index.js";

const router = Router();

router.use(requireAuth);

router.get("/", cartController.getCart);
router.post("/", cartController.upsertCart);
router.delete("/", cartController.deleteCart);

export default router;
