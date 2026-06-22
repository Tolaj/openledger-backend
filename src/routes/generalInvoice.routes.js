import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { generalInvoiceController } from "../controllers/generalInvoice.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/",          generalInvoiceController.getAll);
router.get("/:id/pdf",   generalInvoiceController.pdf);
router.get("/:id",       generalInvoiceController.getOne);
router.post("/",         generalInvoiceController.create);
router.post("/:id/send", generalInvoiceController.send);
router.put("/:id",       generalInvoiceController.update);
router.delete("/:id",    generalInvoiceController.remove);

export default router;
