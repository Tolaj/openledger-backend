import { Router } from "express";
import { cartController } from "../controllers/index.js";

const router = Router();

router.get("/", cartController.getCart);
router.post("/", cartController.upsertCart);
router.delete("/", cartController.deleteCart);

export default router;
