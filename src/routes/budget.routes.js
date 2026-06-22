import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { budgetController } from "../controllers/index.js";

const router = Router();

router.use(requireAuth);

router.get("/", budgetController.getAll);
router.get("/:id", budgetController.getOne);
router.post("/", budgetController.create);
router.put("/:id", budgetController.update);
router.delete("/:id", budgetController.remove);

export default router;
