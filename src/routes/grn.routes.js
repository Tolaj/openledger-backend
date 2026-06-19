import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { grnController } from "../controllers/grn.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", grnController.getAll);
router.get("/:id", grnController.getOne);
router.post("/", grnController.create);
router.delete("/:id", grnController.remove);

export default router;
