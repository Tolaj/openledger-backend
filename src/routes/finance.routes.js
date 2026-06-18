import { Router } from "express";
import { financeController } from "../controllers/index.js";

const router = Router();

router.get("/summary", financeController.getSummary);
router.get("/", financeController.getAll);
router.get("/:id", financeController.getOne);
router.post("/", financeController.create);
router.put("/:id", financeController.update);
router.delete("/:id", financeController.remove);
router.patch("/:id/settle/:debtIndex", financeController.settle);

export default router;
