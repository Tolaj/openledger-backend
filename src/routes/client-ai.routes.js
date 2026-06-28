import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import * as clientAiController from "../controllers/client-ai.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/key", clientAiController.getKeyAndContext);

export default router;
