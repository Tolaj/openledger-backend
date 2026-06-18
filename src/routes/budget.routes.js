import { Router } from "express";
import { budgetController } from "../controllers/index.js";

const router = Router();

router.get("/", budgetController.getAll);
router.get("/:id", budgetController.getOne);
router.post("/", budgetController.create);
router.put("/:id", budgetController.update);
router.delete("/:id", budgetController.remove);

export default router;
