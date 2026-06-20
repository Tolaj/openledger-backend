import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { generalInvoiceController } from "../controllers/generalInvoice.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/",      generalInvoiceController.getAll);
router.get("/:id",   generalInvoiceController.getOne);
router.post("/",     generalInvoiceController.create);
router.put("/:id",   generalInvoiceController.update);
router.delete("/:id", generalInvoiceController.remove);

export default router;
