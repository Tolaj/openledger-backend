import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { salesOrderController } from "../controllers/salesOrder.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", salesOrderController.getAll);
router.get("/:id", salesOrderController.getOne);
router.post("/", salesOrderController.create);
router.put("/:id", salesOrderController.update);
router.delete("/:id", salesOrderController.remove);

export default router;
