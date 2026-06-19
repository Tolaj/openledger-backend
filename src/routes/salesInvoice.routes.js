import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { salesInvoiceController } from "../controllers/salesInvoice.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/",     salesInvoiceController.getAll);
router.get("/:id",  salesInvoiceController.getOne);
router.post("/",    salesInvoiceController.create);
router.put("/:id",  salesInvoiceController.update);
router.delete("/:id", salesInvoiceController.remove);

export default router;
