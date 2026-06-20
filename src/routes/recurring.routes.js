import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { recurringController } from "../controllers/recurring.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/",      recurringController.getAll);
router.get("/:id",   recurringController.getOne);
router.post("/",     recurringController.create);
router.put("/:id",   recurringController.update);
router.delete("/:id", recurringController.remove);

export default router;
