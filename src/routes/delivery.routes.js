import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { deliveryController } from "../controllers/delivery.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", deliveryController.getAll);
router.get("/:id", deliveryController.getOne);
router.post("/", deliveryController.create);
router.delete("/:id", deliveryController.remove);

export default router;
