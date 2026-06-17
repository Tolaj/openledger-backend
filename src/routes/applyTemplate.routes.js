import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { applyTemplateController } from "../controllers/index.js";

const router = Router();

router.post("/", requireAuth, applyTemplateController.apply);

export default router;
