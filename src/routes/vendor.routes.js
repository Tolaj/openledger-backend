import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { vendorController } from "../controllers/vendor.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", vendorController.getAll);
router.get("/:id", vendorController.getOne);
router.post("/", vendorController.create);
router.put("/:id", vendorController.update);
router.delete("/:id", vendorController.remove);

export default router;
