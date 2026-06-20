import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { generalOrderController } from "../controllers/generalOrder.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/",      generalOrderController.getAll);
router.get("/:id",   generalOrderController.getOne);
router.post("/",     generalOrderController.create);
router.put("/:id",   generalOrderController.update);
router.delete("/:id", generalOrderController.remove);

export default router;
