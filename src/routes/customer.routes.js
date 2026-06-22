import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { customerController } from "../controllers/customer.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", customerController.getAll);
router.get("/:id", customerController.getOne);
router.post("/", customerController.create);
router.put("/:id", customerController.update);
router.delete("/:id", customerController.remove);

export default router;
