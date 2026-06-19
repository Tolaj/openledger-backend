import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { inventoryController } from "../controllers/index.js";

const router = Router();

router.use(requireAuth);

router.get("/", inventoryController.getAll);
router.get("/:id", inventoryController.getOne);
router.post("/", inventoryController.upsert);
router.put("/:id", inventoryController.update);
router.delete("/:id", inventoryController.remove);

export default router;
