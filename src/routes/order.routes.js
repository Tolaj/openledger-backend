import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { orderController } from "../controllers/index.js";

const router = Router();

router.use(requireAuth);

router.get("/", orderController.getAll);
router.get("/:id", orderController.getOne);
router.post("/", orderController.create);
router.put("/:id", orderController.update);
router.delete("/:id", orderController.remove);

export default router;
