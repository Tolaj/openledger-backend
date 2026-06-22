import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { salesInvoiceController } from "../controllers/salesInvoice.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/",          salesInvoiceController.getAll);
router.get("/:id/pdf",   salesInvoiceController.pdf);
router.get("/:id",       salesInvoiceController.getOne);
router.post("/",         salesInvoiceController.create);
router.post("/:id/send", salesInvoiceController.send);
router.put("/:id",       salesInvoiceController.update);
router.delete("/:id",    salesInvoiceController.remove);

export default router;
