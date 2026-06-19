import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { purchaseInvoiceController } from "../controllers/purchaseInvoice.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/",     purchaseInvoiceController.getAll);
router.get("/:id",  purchaseInvoiceController.getOne);
router.post("/",    purchaseInvoiceController.create);
router.put("/:id",  purchaseInvoiceController.update);
router.delete("/:id", purchaseInvoiceController.remove);

export default router;
