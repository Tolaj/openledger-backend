import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { friendController } from "../controllers/index.js";

const router = Router();

router.use(requireAuth);

router.post("/send", friendController.send);
router.post("/receive", friendController.receive);

export default router;
