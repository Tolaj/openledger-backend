import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { pushController } from "../controllers/push.controller.js";

const router = Router();

router.get("/vapid-key", pushController.vapidKey);
router.post("/subscribe", requireAuth, pushController.subscribe);
router.post("/unsubscribe", requireAuth, pushController.unsubscribe);

export default router;
