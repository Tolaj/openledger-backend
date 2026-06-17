import { Router } from "express";
import { friendController } from "../controllers/index.js";

const router = Router();

router.post("/send", friendController.send);
router.post("/receive", friendController.receive);

export default router;
