import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { generalOrderController } from "../controllers/generalOrder.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/",           generalOrderController.getAll);
router.get("/:id/pdf",    generalOrderController.pdf);
router.get("/:id",        generalOrderController.getOne);
router.post("/",          generalOrderController.create);
router.post("/:id/send",  generalOrderController.send);
router.put("/:id",        generalOrderController.update);
router.delete("/:id",     generalOrderController.remove);

export default router;
