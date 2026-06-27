import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import * as aiController from "../controllers/ai.controller.js";

const router = Router();
router.use(requireAuth);

router.post("/scan-receipt",    aiController.scanReceipt);
router.post("/suggest-product", aiController.suggestProduct);
router.post("/insights",        aiController.getInsights);
router.post("/chat",            aiController.chat);

export default router;
