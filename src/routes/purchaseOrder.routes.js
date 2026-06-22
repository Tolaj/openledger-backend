import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { purchaseOrderController } from "../controllers/purchaseOrder.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", purchaseOrderController.getAll);
router.get("/:id", purchaseOrderController.getOne);
router.post("/", purchaseOrderController.create);
router.get("/:id/pdf", purchaseOrderController.pdf);
router.post("/:id/send", purchaseOrderController.send);
router.put("/:id", purchaseOrderController.update);
router.delete("/:id", purchaseOrderController.remove);

export default router;
