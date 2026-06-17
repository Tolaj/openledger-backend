import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { templateController } from "../controllers/index.js";

const router = Router();

router.get("/", templateController.getAll);
router.post("/", requireAuth, templateController.create);
router.delete("/:id", requireAuth, templateController.remove);

export default router;
